import { FileInput } from "./FileInput";
import * as Cut from "../GrabCut";
import * as ImgUtil from "./ImageUtil";
import * as Util from "../Utility";
import * as Cam from "./Camera";

//TODO: callback functions are generally evil
//Rewrite using static callback functions with an explicit this parameter instead.

export class Editor {
    file: FileInput;
    originalImageData: ImageData;
    canvas: HTMLCanvasElement;
    img: null | HTMLImageElement = null;
    region: Cam.Rect; //Defines the region (in screen space) that can be manipulated

    selStart: Cam.Point = Cam.origin; //In screen space
    selEnd: Cam.Point = Cam.origin;
    inSelection: boolean = false;

    constructor(file: FileInput, canvasID: string) {
        this.file = file;
        this.canvas = <HTMLCanvasElement>document.getElementById(canvasID);

        let callback = () => Editor.loadImage(this);
        this.file.RegisterImageLoad(callback);

        let loadDrawCallback = () => Editor.beginDraw(this);
        window.addEventListener("resize", loadDrawCallback);

        this.canvas.addEventListener("mousedown", (ev) => Editor.beginRect(ev, this));
        this.canvas.addEventListener("mousemove", (ev) => Editor.dragRect(ev, this));
        this.canvas.addEventListener("mouseup", (ev) => Editor.endRect(ev, this));

        //Cleanup later
        let btn = document.getElementById("btn-crop");
        btn.addEventListener("click", () => Editor.CropHandler(this));
    }

    private static beginRect(e: MouseEvent, self: Editor) {
        let start = Cam.RelPos(e.clientX, e.clientY, self.canvas);
        self.selStart = start;
        self.selEnd = start;
        self.inSelection = true;
    }

    private static dragRect(e: MouseEvent, self: Editor) {
        if (self.inSelection) {
            let pt = Cam.RelPos(e.clientX, e.clientY, self.canvas);
            self.selEnd = pt;
            Editor.beginDraw(self);
        }
    }

    private static endRect(e: MouseEvent, self: Editor) {
        self.inSelection = false;
    }

    private static DrawRectOnCanvas(hDC: CanvasRenderingContext2D, self: Editor) {
        let r = Cam.Points2Rect(self.selStart, self.selEnd);
        hDC.beginPath();
        hDC.rect(r.x, r.y, r.width, r.height);
        hDC.stroke();
    }

    private static Client2BufferRect(client:Cam.Rect, self:Editor):Cam.Rect{
        let bufferWidth = self.originalImageData.width;
        let bufferHeight = self.originalImageData.height;

        let clientB = Cam.Rect2RectB(client);
        let bufferP1 = Cam.Canvas2Buffer(clientB.left, clientB.top, self.region, bufferWidth, bufferHeight);
        let bufferP2 = Cam.Canvas2Buffer(clientB.right, clientB.bot, self.region, bufferWidth, bufferHeight);
        return Cam.Points2Rect(bufferP1, bufferP2);
    }

    //End of selection
    private static CropHandler(self:Editor){
        let clientRect = Cam.Points2Rect(self.selStart, self.selEnd);
        let boundingRect = self.region;
        let clientCropped = Cam.ClipRect(clientRect, boundingRect);
        let bufferCropped = Editor.Client2BufferRect(clientCropped,self);
        Editor.StartGrabCut(bufferCropped, self);
    }

    private static beginDraw(self: Editor) {
        console.log("redraw");
        let [srcWidth, srcHeight] = [self.canvas.scrollWidth, self.canvas.scrollHeight];
        let [bufferWidth, bufferHeight] = [self.canvas.width, self.canvas.height];
        //Resize buffer to the resolution of the actual canvas in the browser

        if (srcWidth != bufferWidth || srcHeight != bufferHeight) {
            self.canvas.width = srcWidth;
            self.canvas.height = srcHeight;
        }

        let hDC = self.canvas.getContext("2d");
        hDC.clearRect(0, 0, srcWidth, srcHeight);
        if (self.img != null) {
            let [imgWidth, imgHeight] = [self.originalImageData.width, self.originalImageData.height];
            let coord = this.FitToRectangle(srcWidth, srcHeight, imgWidth, imgHeight);
            self.region = coord;
            hDC.drawImage(self.img, coord.x, coord.y, coord.width, coord.height);

            hDC.beginPath();
            hDC.rect(self.region.x, self.region.y, self.region.width, self.region.height);
            hDC.stroke();
        }

        Editor.DrawRectOnCanvas(hDC, self);
    }

    private static FitToRectangle(maxWidth: number, maxHeight: number, imgWidth: number, imgHeight: number): Cam.Rect {
        let [xScale, yScale] = [maxWidth / imgWidth, maxHeight / imgHeight];

        let minScale = Math.min(xScale, yScale);
        let scale = ((minScale) < 1) ? minScale : 1.0; //If the image can fit within the rect without downscaling, don't upscale it

        let w = imgWidth * scale;
        let h = imgHeight * scale;

        // Centre image
        let x = (maxWidth - w) / 2;
        let y = (maxHeight - h) / 2;
        return { x: x, y: y, width: w, height: h } as Cam.Rect;
    }

    private static loadImage(self: Editor) {
        let img = new Image();
        let fileURL = self.file.GetDataURL();

        let _ =
            new Promise<[number, number]>((resolve) => {
                img.onload = () => {
                    let height = img.naturalHeight;
                    let width = img.naturalWidth;
                    resolve([height, width]);
                }
                img.src = fileURL;

            }).then((dimensions: [number, number]) => {
                let tempCanvas: HTMLCanvasElement = document.createElement("canvas");
                tempCanvas.height = dimensions[0];
                tempCanvas.width = dimensions[1];
                let hDC = tempCanvas.getContext("2d");
                hDC.drawImage(img, 0, 0);
                self.originalImageData = hDC.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

            }).then(() => {
                self.img = img;
                Editor.beginDraw(self);
            }).then(() => {
                let [width, height] = [self.originalImageData.width, self.originalImageData.height];
                let margin = 0.2;
                let x = Math.floor(width * margin);
                let y = Math.floor(height * margin);
                let w = Math.floor(width * (1 - 2 * margin));
                let h = Math.floor(height * (1 - 2 * margin));
                //Editor.StartGrabCut({x:x, y:y, width:w, height:h}, self);
            })
    }

    private static StartGrabCut(rect:Cam.Rect, self:Editor){
        let img = ImgUtil.ImageData2Mat(self.originalImageData);
        let cut = new Cut.GrabCut(img);
        let [width, height] = [self.originalImageData.width, self.originalImageData.height];
        let trimap = Util.Fill2DObj<Cut.Trimap>(
            height,
            width,
            () => Cut.Trimap.Background);
        let [x,y,w,h] = [rect.x, rect.y, rect.width, rect.height].map(n => Math.floor(n)); 
        Util.Fill2DRect<Cut.Trimap>(trimap, Cut.Trimap.Unknown, x, y, w, h);
        cut.SetTrimap(trimap, width, height);
        cut.BeginCrop();
        let mask = cut.GetAlphaMask();
        let maskPreview = ImgUtil.CreateBWImage(mask);
        let previewWindow = <HTMLImageElement>document.getElementById("img-preview");
        previewWindow.src = maskPreview;
        previewWindow.style.width = `${width}px`;
        previewWindow.style.height = `${height}px`;
    }
}
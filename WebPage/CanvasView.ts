import { Model } from "./Model";
import * as Cam from "./Drawing2D";
import * as T from "Transform";
import * as Mat from "../Matrix";

export class CanvasView {
    drawRegion: Cam.Rect; //in screen space
    imgCanvas: HTMLCanvasElement;
    editingCanvas: HTMLCanvasElement;
    model: Model;

    private ZOOM_MAX: number = 2.0;
    private ZOOM_MIN: number = 0;
    private zoomFactor = 1.0;

    //Offsets from the centre of the image
    private offsetX: number = 0;
    private offsetY: number = 0;

    constructor(imgCanvas: HTMLCanvasElement, editingCanvas: HTMLCanvasElement) {
        this.imgCanvas = imgCanvas;
        this.editingCanvas = editingCanvas;

        window.addEventListener("resize", this.Draw.bind(this));
    }

    AttachModel(model: Model) {
        this.model = model;
    }

    private GetMinScale(): number {
        let [width, height] = [this.imgCanvas.width, this.imgCanvas.height];
        let [imgWidth, imgHeight] = this.model.GetImageDim();

        let minScale = Math.min((width / imgWidth), (height / imgHeight));
        minScale = Math.min(minScale, 1);
        return minScale;
    }

    GetPreviewDim(): [number, number] {
        let [imgWidth, imgHeight] = this.model.GetImageDim();
        let scale = this.GetMinScale();
        return [imgWidth * scale, imgHeight * scale];
    }

    ImgToCanvasTransform(): Mat.Matrix {
        //Translate from image to canvas space
        //When offsetX and offsetY are 0, the image is centred on the canvas
        let [cWidth, cHeight] = [this.imgCanvas.width, this.imgCanvas.height];
        let [imgWidth, imgHeight] = this.model.GetImageDim();

        let xOffset = cWidth * 0.5 - ((imgWidth + this.offsetX) * 0.5 * this.zoomFactor);
        let yOffset = cHeight * 0.5 - ((imgHeight + this.offsetY) * 0.5 * this.zoomFactor);
        let translation = T.Translate2D(xOffset, yOffset);
        let zoom = T.Scale2D(this.zoomFactor, this.zoomFactor);

        let [transform, _ ] = T.ChainTransform(translation, zoom);
        return transform;
    }

    Draw(this: CanvasView) {
        CanvasView.ResizeBufferToClientSize(this.editingCanvas);
        CanvasView.ResizeBufferToClientSize(this.imgCanvas);

        let [width, height] = [this.imgCanvas.width, this.imgCanvas.height];

        let imgHDC = this.imgCanvas.getContext("2d");
        let editHDC = this.editingCanvas.getContext("2d");

        imgHDC.clearRect(0, 0, width, height);
        editHDC.clearRect(0, 0, width, height);

        let img = this.model.GetOriginalImage();
        if (img == null) return;

        let [imgWidth, imgHeight] = this.model.GetImageDim();

        this.zoomFactor = this.GetMinScale();

        let imgRect: Cam.Rect = { x: 0, y: 0, width: imgWidth, height: imgHeight };
        let imgToCanvas = this.ImgToCanvasTransform();
        let canvasImgRect = T.TransformRect(imgToCanvas, imgRect);

        //Render 1st layer (just the image)
        imgHDC.drawImage(img, canvasImgRect.x, canvasImgRect.y, canvasImgRect.width, canvasImgRect.height);

        //Render 2nd layer (user mask input)
        editHDC.save(); //Save original clipping region
        let clipRegion = new Path2D(); //Clip everything to the image onscreen

        clipRegion.rect(canvasImgRect.x, canvasImgRect.y, canvasImgRect.width, canvasImgRect.height);
        editHDC.clip(clipRegion);
        //Draw
        let drawOps = this.model.GetDrawOps(imgToCanvas);
        drawOps.forEach(d => {
            d.Draw(editHDC);
        });

        editHDC.restore(); //Reset clip
    }

    //Resize buffer to the resolution of the actual canvas in the browser
    private static ResizeBufferToClientSize(canvas: HTMLCanvasElement) {
        let [srcWidth, srcHeight] = [canvas.scrollWidth, canvas.scrollHeight];
        let [bufferWidth, bufferHeight] = [canvas.width, canvas.height];

        if (srcWidth != bufferWidth || srcHeight != bufferHeight) {
            canvas.width = srcWidth;
            canvas.height = srcHeight;
        }
    }
}
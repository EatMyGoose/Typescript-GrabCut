import { FileInput } from "./FileInput";
import * as Cut from "../GrabCut";
import * as ImgUtil from "./ImageUtil";
import * as Util from "../Utility";
import * as Cam from "./Drawing2D";
import { CanvasView } from "./CanvasView";
import { PreviewView } from "./PreviewView";
import * as Ed from "./DrawCall";
import * as Mat from "../Matrix";

export const FGColour = new ImgUtil.RGBA(255, 0, 0, 255); //Red
export const BGColour = new ImgUtil.RGBA(0, 0, 255, 255); //Blue

export class Model {
    private originalImage: HTMLImageElement;
    private originalImageData: ImageData;

    //Stores the result of the cropped image in a data URL
    private croppedImage: string = null;
    private croppedImageAlpha: string = null;

    private canvasView: CanvasView;
    private preview: PreviewView;

    private canvasDrawOps: Ed.IDrawCall[] = [];
    private pendingDrawOps: Ed.IDrawCall = null;

    constructor() {
    }

    BeginDrawCall(call: Ed.IDrawCall): void {
        this.pendingDrawOps = call;
        this.TriggerCanvasRedraw();
    }

    UpdateDrawCall(call: Ed.IDrawCall, finalize: boolean = false): void {
        if (!finalize) {
            this.pendingDrawOps = call;
        } else {
            this.pendingDrawOps = null;
            this.canvasDrawOps.push(call);
        }
        this.TriggerCanvasRedraw();
    }

    UndoLast() {
        if (this.pendingDrawOps != null) {
            //Stop current operation
            this.pendingDrawOps = null;
        } else {
            //Stop last queued operation
            if (this.canvasDrawOps.length == 0) return;

            this.canvasDrawOps.pop();
        }
        this.TriggerCanvasRedraw();
    }

    GetDrawOps(imgToDestTransform: Mat.Matrix): Ed.IDrawCall[] {
        let last = (this.pendingDrawOps == null) ? [] : [this.pendingDrawOps];
        let merged = this.canvasDrawOps.concat(last);
        return merged.map(drawOp => drawOp.Transform(imgToDestTransform));
    }

    private TriggerCanvasRedraw() {
        this.canvasView.Draw();
    }

    AttachView(view: CanvasView) {
        this.canvasView = view;
    }

    AttachPreviewView(preview: PreviewView) {
        this.preview = preview;
    }

    ClearSelection(): void {
        this.pendingDrawOps = null;
        this.canvasDrawOps = [];
    }

    ImageLoaded(): boolean {
        return this.originalImage != null;
    }

    SetImage(this: Model, imageURL: string): void {
        this.ClearSelection();
        this.croppedImage = null;
        this.croppedImageAlpha = null;

        let img = new Image();
        let fileURL = imageURL;

        let _ =
            new Promise<[number, number]>((resolve) => {
                //Just to get the images dimensions
                img.onload = () => {
                    let height = img.naturalHeight;
                    let width = img.naturalWidth;
                    resolve([height, width]);
                }
                img.src = fileURL;

            }).then((dimensions: [number, number]) => {
                //Render an image URL onto a canvas
                let tempCanvas: HTMLCanvasElement = document.createElement("canvas");
                tempCanvas.height = dimensions[0];
                tempCanvas.width = dimensions[1];
                let hDC = tempCanvas.getContext("2d");
                hDC.drawImage(img, 0, 0);
                this.originalImageData = hDC.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                this.originalImage = img;
                //Fire off the (canvas) view's draw event
                this.canvasView.InitImageLoad();
                this.TriggerCanvasRedraw();
                this.preview.Draw();
            });
    }

    //Width, Height;
    GetImageDim(): [number, number] {
        return [this.originalImage.width, this.originalImageData.height];
    }

    GetCoordSystem(): Cam.Rect {
        let [width, height] = this.GetImageDim();
        return { x: 0, y: 0, width: width, height: height };
    }

    GetOriginalImage(): HTMLImageElement {
        return this.originalImage;
    }

    GetCroppedImageURL(alphaOnly: boolean): string {
        if (alphaOnly)
            return this.croppedImageAlpha;
        else
            return this.croppedImage;
    }

    private GetTrimap() {
        let [width, height] = this.GetImageDim();
        let tempCanvas = new ImgUtil.Temp2DCanvas(width, height);
        let hDC = tempCanvas.GetHDC();
        let Identity = Mat.Identity(3);
        let ops = this.GetDrawOps(Identity);
        ops.forEach(op => op.Draw(hDC));

        let imgData = tempCanvas.GetImageData();

        //Convert rendered image to a trimap
        let trimap = Util.Fill2DObj<Cut.Trimap>(height, width, () => Cut.Trimap.Unknown);

        let arr = imgData.data;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let offset = (y * width + x) * 4;
                let r = arr[offset + 0];
                let g = arr[offset + 1];
                let b = arr[offset + 2];
                let a = arr[offset + 3];
                let pixelColour = new ImgUtil.RGBA(r, g, b, a);
                let trimapValue: Cut.Trimap;
                if (pixelColour.Equals(FGColour)) {
                    trimapValue = Cut.Trimap.Foreground;
                } else if (pixelColour.Equals(BGColour)) {
                    trimapValue = Cut.Trimap.Background;
                } else {
                    trimapValue = Cut.Trimap.Unknown;
                }
                trimap[y][x] = trimapValue;
            }
        }
        return trimap;
    }

    StartGrabCut(this: Model,
        maxIter: number,
        tolerance: number,
        nBGClusters: number,
        nFGClusters: number,
        cohesionFactor: number): void {

        let [width, height] = this.GetImageDim();
        let img = ImgUtil.ImageData2Mat(this.originalImageData);
        let cut = new Cut.GrabCut(img);
        let trimap = this.GetTrimap();

        cut.SetTrimap(trimap, width, height);
        cut.BeginCrop({ 
            tolerance: tolerance, 
            maxIterations: maxIter, 
            cohesionFactor:cohesionFactor, 
            nFGClusters: nFGClusters, 
            nBGClusters: nBGClusters});

        let mask = cut.GetAlphaMask();
        //this.croppedImage = ImgUtil.ApplyAlphaMask(this.originalImageData, mask);
        let alphaApplied = ImgUtil.ApplyAlphaMaskToImgData(this.originalImageData, mask);
        this.croppedImage = ImgUtil.ImgData2URL(alphaApplied);
        this.croppedImageAlpha = ImgUtil.CreateBWImage(mask);

        this.preview.Draw();
    }
}
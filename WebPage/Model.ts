import * as Cut from "../GrabCut";
import * as ImgUtil from "./ImageUtil";
import * as Util from "../Utility";
import * as Cam from "./Drawing2D";
import { CanvasView } from "./CanvasView";
import { PreviewView } from "./PreviewView";
import * as Ed from "./DrawCall";
import * as Mat from "../Matrix";
import * as Dict from "../Collections/Dictionary";

export const FGColour = new ImgUtil.RGBA(255, 0, 0, 255); //Red
export const BGColour = new ImgUtil.RGBA(0, 0, 255, 255); //Blue

interface CroppedImageSet {
    bitmap: string,
    mask: string,
}

export class Model {
    private originalImage: HTMLImageElement;
    private originalImageData: ImageData;

    //Stores the result of the cropped image in a data URL
    private croppedUnfeathered: CroppedImageSet = null;
    private croppedFeathered: CroppedImageSet = null;

    private canvasView: CanvasView;
    private preview: PreviewView;

    private canvasDrawOps: Ed.IDrawCall[] = [];
    private uiDrawOps: Dict.ObjectDict<Ed.IDrawCall> = new Dict.ObjectDict<Ed.IDrawCall>();

    constructor() {
    }

    BeginDrawCall(id: string, call: Ed.IDrawCall): void {
        this.uiDrawOps.Set(id, call);
        this.TriggerCanvasRedraw();
    }

    UpdateDrawCall(id: string, call: Ed.IDrawCall, finalize: boolean = false): void {
        if (!finalize) {
            this.uiDrawOps.Set(id, call);
        } else {
            this.uiDrawOps.Remove(id);
            this.canvasDrawOps.push(call);
        }
        this.TriggerCanvasRedraw();
    }

    RemoveUIElement(id:string){
        if(this.uiDrawOps.ContainsKey(id)){
            this.uiDrawOps.Remove(id);
            this.TriggerCanvasRedraw();
        }
    }

    UndoLast(id: string) {
        //TODO: Implement functionality to undo currently drawn brush as well
        //Stop last queued operation

        if (id != null && this.uiDrawOps.ContainsKey(id)) {
            this.uiDrawOps.Remove(id);
        } else {
            if (this.canvasDrawOps.length == 0) return;
            this.canvasDrawOps.pop();
        }
        this.TriggerCanvasRedraw();
    }

    GetDrawOps(imgToDestTransform: Mat.Matrix, showUI: boolean): Ed.IDrawCall[] {
        let tail = (showUI) ? this.uiDrawOps.ToList().map(t => t[1]) : [];
        let merged = this.canvasDrawOps.concat(tail);
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
        this.canvasDrawOps = [];
    }

    ImageLoaded(): boolean {
        return this.originalImage != null;
    }

    SetImage(this: Model, imageURL: string): void {
        this.ClearSelection();
        this.croppedUnfeathered = null;
        this.croppedFeathered = null;

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

    GetCroppedImageURL(alphaOnly: boolean, feathered: boolean): string | null {
        let dataSet = feathered ? this.croppedFeathered : this.croppedUnfeathered;
        if (dataSet != null) {
            return alphaOnly ? dataSet.mask : dataSet.bitmap;
        } else {
            return null;
        }
    }

    private GetTrimap() {
        let [width, height] = this.GetImageDim();
        let tempCanvas = new ImgUtil.Temp2DCanvas(width, height);
        let hDC = tempCanvas.GetHDC();
        let Identity = Mat.Identity(3);
        let ops = this.GetDrawOps(Identity, false);
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
        let img: Mat.Matrix[] = ImgUtil.ImgData2_1DMat(this.originalImageData);
        let cut = new Cut.GrabCut(img, width, height);
        let trimap = this.GetTrimap();

        cut.SetTrimap(trimap, width, height);
        cut.BeginCrop({
            tolerance: tolerance,
            maxIterations: maxIter,
            cohesionFactor: cohesionFactor,
            nFGClusters: nFGClusters,
            nBGClusters: nBGClusters
        });

        let mask = cut.GetAlphaMask();

        this.croppedUnfeathered = {
            bitmap: ImgUtil.ImgData2URL(ImgUtil.ApplyAlphaMaskToImgData(this.originalImageData, mask)),
            mask: ImgUtil.CreateBWImage(mask),
        };

        let featheredMask = ImgUtil.FeatherMask(mask);
        this.croppedFeathered = {
            bitmap: ImgUtil.ImgData2URL(ImgUtil.ApplyAlphaMaskToImgData(this.originalImageData, featheredMask)),
            mask: ImgUtil.CreateBWImage(featheredMask),
        };

        this.preview.Draw();
    }
}
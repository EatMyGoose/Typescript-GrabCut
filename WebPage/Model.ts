import { FileInput } from "./FileInput";
import * as Cut from "../GrabCut";
import * as ImgUtil from "./ImageUtil";
import * as Util from "../Utility";
import * as Cam from "./Camera";
import {CanvasView} from "./View";
import { PreviewView } from "./PreviewView";

//TODO: Add a second view (preview window) to show the cropped image

export class Model {
    private originalImage: HTMLImageElement;
    private originalImageData: ImageData;
    private selectedRegion: Cam.Rect | null = null; //In buffer space
    //Stores the result of the cropped image in a data URL
    private croppedImage: string = null;
    private croppedImageAlpha: string = null;

    private canvasView: CanvasView;
    private preview: PreviewView;

    constructor() {
    }

    private TriggerCanvasRedraw(){
        this.canvasView.Draw();
    }

    AttachView(view:CanvasView){
        this.canvasView = view;
    }

    AttachPreviewView(preview: PreviewView){
        this.preview = preview;
    }

    SetSelectedRegion(this:Model, region:Cam.Rect):void{
        this.selectedRegion = region;
        this.TriggerCanvasRedraw();
    }

    SetImage(this: Model, imageURL:string):void{
        this.croppedImage = null;
        this.croppedImageAlpha = null;
        this.selectedRegion = null;

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
                this.TriggerCanvasRedraw();
                this.preview.Draw();
            });
    }

    //Width, Height;
    GetImageDim(): [number, number]{
        return [this.originalImage.width, this.originalImageData.height];
    }

    GetSelectedRegion(): Cam.Rect | null{
        return this.selectedRegion;
    }

    GetOriginalImage(): HTMLImageElement{
        return this.originalImage;
    }

    GetImageData(): ImageData{
        return this.originalImageData;
    }

    GetCroppedImageURL(alphaOnly:boolean):string{
        if(alphaOnly) 
            return this.croppedImageAlpha;
        else    
            return this.croppedImage;
    }

    StartGrabCut(this:Model):void{
        let img = ImgUtil.ImageData2Mat(this.originalImageData);
        let cut = new Cut.GrabCut(img);
        let [width, height] = [this.originalImageData.width, this.originalImageData.height];
        let trimap = Util.Fill2DObj<Cut.Trimap>(
            height,
            width,
            () => Cut.Trimap.Background);
        let selected = this.selectedRegion;
        let [x,y,w,h] = [selected.x, selected.y, selected.width, selected.height].map(n => Math.floor(n)); 
        Util.Fill2DRect<Cut.Trimap>(trimap, Cut.Trimap.Unknown, x, y, w, h);
        cut.SetTrimap(trimap, width, height);
        cut.BeginCrop();

        
        let mask = cut.GetAlphaMask();
        this.croppedImage = ImgUtil.ApplyAlphaMask(this.originalImageData, mask);
        this.croppedImageAlpha = ImgUtil.CreateBWImage(mask);
            
        this.preview.Draw();
    }
}
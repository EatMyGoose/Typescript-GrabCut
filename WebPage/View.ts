import { Model } from "./Model";
import * as Cam from "./Camera";

export class CanvasView{
    drawRegion: Cam.Rect; //in screen space
    canvas: HTMLCanvasElement;
    model:Model;

    constructor(drawable:HTMLCanvasElement){
        this.canvas = drawable;

        window.addEventListener("resize", this.Draw.bind(this));
    }

    AttachModel(model:Model){
        this.model = model;
    }

    GetDrawRegion():Cam.Rect{
        return this.drawRegion;
    }

    Draw(this:CanvasView){
        console.log("redraw");
        this.ResizeBufferToClientSize();
        let [width, height] = [this.canvas.width, this.canvas.height];

        let hDC = this.canvas.getContext("2d");
        let img = this.model.GetOriginalImage();

        hDC.clearRect(0, 0, width, height);
        if (img != null) {
            let imgData = this.model.GetImageData();
            let [imgWidth, imgHeight] = [imgData.width, imgData.height];

            let coord = Cam.FitToRectangle(width, height, imgWidth, imgHeight);
            this.drawRegion = coord;
            hDC.drawImage(img, coord.x, coord.y, coord.width, coord.height);
        }

        this.DrawSelectionRectOnCanvas(hDC);
    }

    private DrawSelectionRectOnCanvas(this:CanvasView, hDC: CanvasRenderingContext2D) {
        let region = this.model.GetSelectedRegion();
        if(region != null){
            let imgData = this.model.GetImageData();
            let clientRect = Cam.BufferRect2CanvasRect(region, imgData.width, imgData.height, this.drawRegion);
            hDC.beginPath();
            hDC.rect(clientRect.x, clientRect.y, clientRect.width, clientRect.height);
            hDC.stroke();
        }
    }

    //Resize buffer to the resolution of the actual canvas in the browser
    private ResizeBufferToClientSize(){
        let [srcWidth, srcHeight] = [this.canvas.scrollWidth, this.canvas.scrollHeight];
        let [bufferWidth, bufferHeight] = [this.canvas.width, this.canvas.height];
        
        if (srcWidth != bufferWidth || srcHeight != bufferHeight) {
            this.canvas.width = srcWidth;
            this.canvas.height = srcHeight;
        }
    }
}
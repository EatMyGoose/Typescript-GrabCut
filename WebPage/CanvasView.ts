import { Model } from "./Model";
import * as Cam from "./Camera";

export class CanvasView {
    drawRegion: Cam.Rect; //in screen space
    imgCanvas: HTMLCanvasElement;
    editingCanvas: HTMLCanvasElement;
    model: Model;

    constructor(imgCanvas: HTMLCanvasElement, editingCanvas: HTMLCanvasElement) {
        this.imgCanvas = imgCanvas;
        this.editingCanvas = editingCanvas;

        window.addEventListener("resize", this.Draw.bind(this));
    }

    AttachModel(model: Model) {
        this.model = model;
    }

    GetDrawRegion(): Cam.Rect {
        return this.drawRegion;
    }

    Draw(this: CanvasView) {
        console.log("redraw");
        CanvasView.ResizeBufferToClientSize(this.editingCanvas);
        CanvasView.ResizeBufferToClientSize(this.imgCanvas);

        let [width, height] = [this.imgCanvas.width, this.imgCanvas.height];

        let imgHDC = this.imgCanvas.getContext("2d");
        let editHDC = this.editingCanvas.getContext("2d");

        let img = this.model.GetOriginalImage();

        imgHDC.clearRect(0, 0, width, height);
        editHDC.clearRect(0, 0, width, height);

        if (img == null) return;

        let [imgWidth, imgHeight] = this.model.GetImageDim();

        let coord = Cam.FitToRectangle(width, height, imgWidth, imgHeight);
        this.drawRegion = coord;

        //Render 1st layer (just the image)
        imgHDC.drawImage(img, coord.x, coord.y, coord.width, coord.height);

        //Render 2nd layer (user mask input)

        //Save original clipping region
        editHDC.save();
        //Clip everything to the image onscreen
        let clipRegion = new Path2D();
        clipRegion.rect(coord.x, coord.y, coord.width, coord.height);
        editHDC.clip(clipRegion);
        //Draw
        let drawOps = this.model.GetDrawOps(this.GetDrawRegion());
        drawOps.forEach(d => {
            d.Draw(editHDC);
        });

        //Reset clip
        editHDC.restore();
    }

    //Resize buffer to the resolution of the actual canvas in the browser
    private static ResizeBufferToClientSize(canvas:HTMLCanvasElement) {
        let [srcWidth, srcHeight] = [canvas.scrollWidth, canvas.scrollHeight];
        let [bufferWidth, bufferHeight] = [canvas.width, canvas.height];

        if (srcWidth != bufferWidth || srcHeight != bufferHeight) {
            canvas.width = srcWidth;
            canvas.height = srcHeight;
        }
    }
}
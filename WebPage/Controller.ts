
import * as File from "./FileInput";
import * as Cam from "./Camera";
import {Model} from "./Model";
import { CanvasView } from "./View";

export class Controller{
    canvasView: CanvasView;
    model:Model;

    file: File.FileInput;
    canvas: HTMLCanvasElement;

    selStart:Cam.Point = Cam.origin; //Client space
    selEnd:Cam.Point = Cam.origin; //Client space
    inSelection:boolean = false; 

    cropBtn: HTMLInputElement;

    constructor(file: File.FileInput, canvas:HTMLCanvasElement, cropBtn: HTMLInputElement){
        this.file = file;
        this.canvas = canvas;
        this.cropBtn = cropBtn;

        canvas.addEventListener("mousedown", this.beginRect.bind(this));
        canvas.addEventListener("mousemove", this.dragRect.bind(this));
        canvas.addEventListener("mouseup", this.endRect.bind(this));

        cropBtn.addEventListener("click", this.triggerGrabCut.bind(this));
    }

    AttachView(canvasView:CanvasView){
        this.canvasView = canvasView;
    }

    AttachModel(model:Model){
        console.log(this);
        this.model = model;
        this.file.RegisterImageLoad(() => {
            this.model.SetImage(this.file.GetDataURL());
        });
    }

    private triggerGrabCut(){
        this.model.StartGrabCut();
    }

    private beginRect(this: Controller,e: MouseEvent) {
        let start = Cam.RelPos(e.clientX, e.clientY, this.canvas);
        this.selStart = start;
        this.selEnd = start;
        this.inSelection = true;
    }

    private dragRect(this: Controller, e: MouseEvent) {
        if (this.inSelection) {
            let pt = Cam.RelPos(e.clientX, e.clientY, this.canvas);
            this.selEnd = pt;
            this.UpdateModelSelectionRect();
        }
    }

    private endRect(this: Controller) {
        this.inSelection = false;
    }
    
    private UpdateModelSelectionRect(){
        //selection in Client-space 
        let newRegion = Cam.Points2Rect(this.selStart, this.selEnd);
        
        //selection in buffer-space
        let bufferData = this.model.GetImageData();
        let drawRegion = this.canvasView.GetDrawRegion();
        let bufferSpaceSelectionRegion = Cam.CanvasRect2BufferRect(newRegion, drawRegion, bufferData.width, bufferData.height);
        
        this.model.SetSelectedRegion(bufferSpaceSelectionRegion);
    }
}
import * as File from "./FileInput";
import * as Cam from "./Camera";
import { FGColour, BGColour, Model } from "./Model";
import { CanvasView } from "./CanvasView";
import * as Tools from "./ToolHandler";

interface ToolActions{
    name:string,
    drawHandlerFactory: ()=> Tools.IToolHandler, 
    init:()=>void //Stuff that should be done before drawing starts
}

export class Controller {
    canvasView: CanvasView;
    model: Model;

    file: File.FileInput;
    canvas: HTMLCanvasElement;

    cropBtn: HTMLInputElement;

    brushRadioBtns: HTMLInputElement[];
    radiusRange: HTMLInputElement;

    private toolHandler: Tools.IToolHandler = null;

    constructor(file: File.FileInput, canvas: HTMLCanvasElement, cropBtn: HTMLInputElement, brushRadioBtns:HTMLInputElement[], radiusRange: HTMLInputElement) {
        this.file = file;
        this.canvas = canvas;
        this.cropBtn = cropBtn;
        this.brushRadioBtns = brushRadioBtns;
        this.radiusRange = radiusRange;

        canvas.addEventListener("mousedown", this.begin.bind(this));
        canvas.addEventListener("mousemove", this.drag.bind(this));
        canvas.addEventListener("mouseup", this.end.bind(this));

        document.addEventListener("keydown", this.Undo.bind(this));

        cropBtn.addEventListener("click", this.triggerGrabCut.bind(this));
    }

    AttachView(canvasView: CanvasView) {
        this.canvasView = canvasView;
    }

    AttachModel(model: Model) {
        this.model = model;
        this.file.RegisterImageLoad(() => {
            this.model.SetImage(this.file.GetDataURL());
        });
    }

    private triggerGrabCut() {
        this.model.StartGrabCut();
    }

    private GetSelectedBrush(): ToolActions{
        //UI: Red for FG, Blue for BG, transparent for unknown
        let brushRadius = parseFloat(this.radiusRange.value);
        //tool handler factories
        let invertedRectFactory = () => new Tools.InvertedRectToolHandler(BGColour.CSSValue());
        let fgSegmentHandlerFactory = () => new Tools.SegmentToolHandler(brushRadius, FGColour.CSSValue(), false);
        let bgSegmentHandlerFactory = () => new Tools.SegmentToolHandler(brushRadius, BGColour.CSSValue(), false);
        let eraseHandlerFactory = () => new Tools.SegmentToolHandler(brushRadius, "white", true);

        //Initialization functions
        let nil = () => {};
        let clearAllSelections = () => this.model.ClearSelection();

        let actionMappings: ToolActions[] = [
            {name:"fg-rect",  drawHandlerFactory:invertedRectFactory, init:clearAllSelections},
            {name:"fg", drawHandlerFactory:fgSegmentHandlerFactory, init:nil},
            {name:"bg", drawHandlerFactory:bgSegmentHandlerFactory, init:nil},
            {name:"erase", drawHandlerFactory:eraseHandlerFactory, init:nil}
        ];

        let selected = this.brushRadioBtns.find(btn => btn.checked);
        let actions = actionMappings.find(t => t.name == selected.value);
        return actions;
    }

    private Undo(this:Controller, e:KeyboardEvent){
        if(e.ctrlKey && e.key == "z"){
            this.model.UndoLast();
        }   
    }

    private Screen2Buffer(canvasPoint:Cam.Point):Cam.Point{
        let [bufferWidth, bufferHeight] = this.model.GetImageDim();
        let bufferDim = {x:0,y:0, width:bufferWidth, height:bufferHeight};
        let canvasDim = this.canvasView.GetDrawRegion();
        return Cam.Transform2D(canvasPoint, canvasDim, bufferDim);
    }

    private begin(this: Controller, e: MouseEvent) {
        let canvasPoint = Cam.RelPos(e.clientX, e.clientY, this.canvas);
        let start = this.Screen2Buffer(canvasPoint);

        let initActions = this.GetSelectedBrush();
        initActions.init();
        this.toolHandler = initActions.drawHandlerFactory();

        let drawCall = this.toolHandler.MouseDown(start);
        this.model.BeginDrawCall(drawCall);
    }

    private drag(this: Controller, e: MouseEvent) {
        if (this.toolHandler == null) return;

        let canvasPoint = Cam.RelPos(e.clientX, e.clientY, this.canvas);
        let point = this.Screen2Buffer(canvasPoint);

        let drawCall = this.toolHandler.MouseDrag(point);
        this.model.UpdateDrawCall(drawCall,false);
    }

    private end(this: Controller, e:MouseEvent) {
        if(this.toolHandler == null) return;

        let canvasPoint = Cam.RelPos(e.clientX, e.clientY, this.canvas);
        let point = this.Screen2Buffer(canvasPoint);
        let drawCall = this.toolHandler.MouseUp(point);
        this.model.UpdateDrawCall(drawCall, true);
        
        //End control of current handler
        this.toolHandler = null;
    }

}
import * as File from "./FileInput";
import * as Cam from "./Drawing2D";
import { FGColour, BGColour, Model } from "./Model";
import { CanvasView } from "./CanvasView";
import * as Tools from "./ToolHandler";
import * as Mat from "../Matrix";
import * as T from "./Transform";

interface ToolActions {
    name: string,
    drawHandlerFactory: () => Tools.IToolHandler,
    init: () => void //Stuff that should be done before drawing starts
}

const LEFT_CLICK_FLAG = 1;
const RIGHT_CLICK_FLAG = 2;

const LEFT_CLICK_SINGLE = 0;
const RIGHT_CLICK_SINGLE = 2;

class MouseDebounce {
    private MIN_DIST = 2;
    private MIN_MILLIS = 100;
    private lastTime = 0;
    private lastX: number = 0;
    private lastY: number = 0;
    constructor() {

    }

    BeginMovement(x: number, y: number) {
        this.lastTime = window.performance.now();
        this.lastX = x;
        this.lastY = y;
    }

    AllowUpdate(x: number, y: number): boolean {
        let currentMillis = window.performance.now();
        let diff = currentMillis - this.lastTime;

        let dist = Math.sqrt((this.lastX - x) ** 2 + (this.lastY - y) ** 2);

        if (diff > this.MIN_MILLIS ||
            dist > this.MIN_DIST) {

            this.BeginMovement(x, y);
            return true;
        } else {
            return false;
        }
    }
}

export class Controller {
    canvasView: CanvasView;
    model: Model;

    file: File.FileInput;
    canvas: HTMLCanvasElement;

    cropBtn: HTMLInputElement;

    brushRadioBtns: HTMLInputElement[];
    radiusRange: HTMLInputElement;

    optMaxIter: ValidatedTextbox;
    optTolerance: ValidatedTextbox;

    private toolHandler: Tools.IToolHandler = null;
    private debounce: MouseDebounce = new MouseDebounce();

    constructor(
        file: File.FileInput, canvas: HTMLCanvasElement, 
        cropBtn: HTMLInputElement, brushRadioBtns: HTMLInputElement[], 
        radiusRange: HTMLInputElement,
        maxIter:ValidatedTextbox, tolerance:ValidatedTextbox) {

        this.file = file;
        this.canvas = canvas;
        this.cropBtn = cropBtn;
        this.brushRadioBtns = brushRadioBtns;
        this.radiusRange = radiusRange;
        this.optMaxIter = maxIter;
        this.optTolerance = tolerance;

        canvas.addEventListener("mousedown", this.begin.bind(this));
        canvas.addEventListener("mousemove", this.drag.bind(this));
        canvas.addEventListener("mouseup", this.end.bind(this));

        //Disable right click menu on the canvas so the right click can be used for panning
        canvas.addEventListener("contextmenu", e => e.preventDefault());

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
        let maxIter = this.optMaxIter.GetValue();
        let tol = this.optTolerance.GetValue();
        console.log(`max:${maxIter}, tolerance:${tol}`);
        this.model.StartGrabCut(maxIter, tol);
    }

    private GetSelectedBrush(): ToolActions {
        //UI: Red for FG, Blue for BG, transparent for unknown
        let brushRadius = parseFloat(this.radiusRange.value);
        //tool handler factories
        let invertedRectFactory = () => new Tools.InvertedRectToolHandler(BGColour.CSSValue());
        let fgSegmentHandlerFactory = () => new Tools.SegmentToolHandler(brushRadius, FGColour.CSSValue(), false);
        let bgSegmentHandlerFactory = () => new Tools.SegmentToolHandler(brushRadius, BGColour.CSSValue(), false);
        let eraseHandlerFactory = () => new Tools.SegmentToolHandler(brushRadius, "white", true);

        //Initialization functions
        let nil = () => { };
        let clearAllSelections = () => this.model.ClearSelection();

        let actionMappings: ToolActions[] = [
            { name: "fg-rect", drawHandlerFactory: invertedRectFactory, init: clearAllSelections },
            { name: "fg", drawHandlerFactory: fgSegmentHandlerFactory, init: nil },
            { name: "bg", drawHandlerFactory: bgSegmentHandlerFactory, init: nil },
            { name: "erase", drawHandlerFactory: eraseHandlerFactory, init: nil }
        ];

        let selected = this.brushRadioBtns.find(btn => btn.checked);
        let actions = actionMappings.find(t => t.name == selected.value);
        return actions;
    }

    private Undo(this: Controller, e: KeyboardEvent) {
        if (e.ctrlKey && e.key == "z") {
            this.model.UndoLast();
        }
    }

    private Screen2Buffer(canvasPoint: Cam.Point): Cam.Point {
        let [bufferWidth, bufferHeight] = this.model.GetImageDim();
        let bufferDim = { x: 0, y: 0, width: bufferWidth, height: bufferHeight };
        let img2Canvas = this.canvasView.ImgToCanvasTransform();
        let canvas2Img = Mat.Inverse(img2Canvas);
        return T.Apply2DTransform(canvasPoint, canvas2Img);
    }

    private begin(this: Controller, e: MouseEvent) {

        let leftPressed = e.button == LEFT_CLICK_SINGLE;
        if (!leftPressed) return;

        this.debounce.BeginMovement(e.clientX, e.clientY);

        let canvasPoint = Cam.RelPos(e.clientX, e.clientY, this.canvas);
        let start = this.Screen2Buffer(canvasPoint);

        let initActions = this.GetSelectedBrush();
        initActions.init();
        this.toolHandler = initActions.drawHandlerFactory();

        let drawCall = this.toolHandler.MouseDown(start);
        this.model.BeginDrawCall(drawCall);
    }

    private drag(this: Controller, e: MouseEvent) {
        let leftDown = e.buttons & LEFT_CLICK_FLAG;
        
        if (this.toolHandler == null || !leftDown) return;

        let notBebouncing = this.debounce.AllowUpdate(e.clientX, e.clientY);
        if(!notBebouncing) return;

        let canvasPoint = Cam.RelPos(e.clientX, e.clientY, this.canvas);
        let point = this.Screen2Buffer(canvasPoint);

        let drawCall = this.toolHandler.MouseDrag(point);
        this.model.UpdateDrawCall(drawCall, false);
    }

    private end(this: Controller, e: MouseEvent) {

        let leftReleased = e.button == LEFT_CLICK_SINGLE;

        if (this.toolHandler == null || !leftReleased) return;

        let canvasPoint = Cam.RelPos(e.clientX, e.clientY, this.canvas);
        let point = this.Screen2Buffer(canvasPoint);
        let drawCall = this.toolHandler.MouseUp(point);
        this.model.UpdateDrawCall(drawCall, true);

        //End control of current handler
        this.toolHandler = null;
    }

}
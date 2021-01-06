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

class MouseDrag {
    private lastX: number;
    private lastY: number;
    private active: boolean = false;

    constructor() {
    }

    IsActive() {
        return this.active;
    }

    Begin(x: number, y: number) {
        this.lastX = x;
        this.lastY = y;
        this.active = true;
    }

    Drag(x: number, y: number): [number, number] {
        if (!this.active) return [0, 0];

        let diff: [number, number] = [this.lastX - x, this.lastY - y];
        this.lastX = x;
        this.lastY = y;
        return diff;
    }

    End(x: number, y: number): [number, number] {
        let diff = this.Drag(x, y);
        this.active = false;
        return diff;
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

    private mDrag: MouseDrag = new MouseDrag();

    constructor(
        file: File.FileInput, canvas: HTMLCanvasElement,
        cropBtn: HTMLInputElement, brushRadioBtns: HTMLInputElement[],
        radiusRange: HTMLInputElement,
        maxIter: ValidatedTextbox, tolerance: ValidatedTextbox) {

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

        canvas.addEventListener("wheel", this.mouseScroll.bind(this));
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

    private mouseScroll(e: WheelEvent) {
        let zoomFactor = (e.deltaY < 0) ? 1.2 : 0.8;
        this.canvasView.Zoom(zoomFactor);
    }

    private Undo(this: Controller, e: KeyboardEvent) {
        if (e.ctrlKey && e.key == "z") {
            this.model.UndoLast();
        }
    }

    private Screen2Buffer(canvasPoint: Cam.Point): Cam.Point {
        let img2Canvas = this.canvasView.ImgToCanvasTransform();
        let canvas2Img = Mat.Inverse(img2Canvas);
        return T.Apply2DTransform(canvasPoint, canvas2Img);
    }

    private begin(this: Controller, e: MouseEvent) {
        let redraw = false;

        let canvasPoint = Cam.RelPos(e.clientX, e.clientY, this.canvas);
        //Buffer space (corresponds directly to the x,y coordinates on the bitmap)
        let start = (this.model.ImageLoaded())? this.Screen2Buffer(canvasPoint) : Cam.origin; 

        //Brushes
        let leftPressed = e.button == LEFT_CLICK_SINGLE;
        if (leftPressed) {
            this.debounce.BeginMovement(e.clientX, e.clientY);
            let initActions = this.GetSelectedBrush();
            initActions.init();
            this.toolHandler = initActions.drawHandlerFactory();

            let drawCall = this.toolHandler.MouseDown(start);
            this.model.BeginDrawCall(drawCall); //TODO: remove redraw call from model? 

            redraw = true;
        }

        //Panning
        let rightPressed = e.button == RIGHT_CLICK_SINGLE;
        if (rightPressed) {
            this.mDrag.Begin(canvasPoint.x, canvasPoint.y);
            redraw = true;
        }

        if(redraw) this.canvasView.Draw();
    }

    private drag(this: Controller, e: MouseEvent) {


        let redraw = false;

        let canvasPoint = Cam.RelPos(e.clientX, e.clientY, this.canvas);
        let point = (this.model.ImageLoaded())? this.Screen2Buffer(canvasPoint) : Cam.origin;

        //Brushes
        let leftDown = e.buttons & LEFT_CLICK_FLAG;
        let toolSelectedAndLeftDown = this.toolHandler != null && leftDown;

        if (toolSelectedAndLeftDown) {
            let notBebouncing = this.debounce.AllowUpdate(e.clientX, e.clientY);
            if (notBebouncing) {
                let drawCall = this.toolHandler.MouseDrag(point);
                this.model.UpdateDrawCall(drawCall, false);

                redraw = true;
            }
        }

        //Panning
        let rightDown = e.buttons & RIGHT_CLICK_FLAG;
        if (rightDown && this.mDrag.IsActive()) {
            //Use the canvas coordinates, rather than buffer coordinates
            //Using the buffer coordinates causes a feedback loop that results in oscillations
            let [xDiff, yDiff] = this.mDrag.Drag(canvasPoint.x, canvasPoint.y);
            let scale = this.canvasView.GetZoomScale();
            this.canvasView.Pan(xDiff / scale, yDiff / scale);
            redraw = true;
        }

        if(redraw) this.canvasView.Draw();
    }

    private end(this: Controller, e: MouseEvent) {
        let redraw = false;

        let canvasPoint = Cam.RelPos(e.clientX, e.clientY, this.canvas);
        let point = (this.model.ImageLoaded())? this.Screen2Buffer(canvasPoint) : Cam.origin;

        //Brushes
        let leftReleased = e.button == LEFT_CLICK_SINGLE;
        let toolSelected = this.toolHandler != null;

        if (leftReleased && toolSelected) {
            let drawCall = this.toolHandler.MouseUp(point);
            this.model.UpdateDrawCall(drawCall, true);

            //End control of current handler
            this.toolHandler = null;

            redraw = true;
        }

        //Panning
        let rightReleased = e.button == RIGHT_CLICK_SINGLE;
        if (rightReleased && this.mDrag.IsActive()) {
            this.mDrag.End(0,0);
            redraw = true;
        }

        if(redraw) this.canvasView.Draw();
    }

}
import * as Ed from "./DrawCall";
import * as Cam from "./Drawing2D";

export interface IToolHandler{
    MouseDown(canvasPoint:Cam.Point):Ed.IDrawCall;
    MouseDrag(canvasPoint:Cam.Point):Ed.IDrawCall;
    MouseUp(canvasPoint:Cam.Point):Ed.IDrawCall;
}

export class HollowRectToolHandler implements IToolHandler{
    selStart: Cam.Point = Cam.origin; 
    selEnd: Cam.Point = Cam.origin; 
    rect: Ed.HollowRectDrawCall;

    constructor(colour:string = "red", width:number = 2){
        this.rect = new Ed.HollowRectDrawCall(colour, width);
        //Ensure the this point is bound correctly during callbacks
        [this.MouseDown, this.MouseDrag, this.MouseUp].forEach(fn => fn.bind(this));
    }

    MouseDown(canvasPoint: Cam.Point): Ed.IDrawCall {
        this.selStart = this.selEnd = canvasPoint;
        return this.UpdateRect();
    }
    MouseDrag(canvasPoint: Cam.Point): Ed.IDrawCall {
        this.selEnd = canvasPoint;
        return this.UpdateRect();
    }
    MouseUp(canvasPoint: Cam.Point): Ed.IDrawCall {
        this.selEnd = canvasPoint;
        return this.UpdateRect();
    }

    private UpdateRect():Ed.HollowRectDrawCall{
        this.rect.SetPoints(this.selStart, this.selEnd);
        return this.rect;
    }
}

export class InvertedRectToolHandler implements IToolHandler{
    p1:Cam.Point = Cam.origin;
    p2:Cam.Point = Cam.origin;
    invertedRect: Ed.InvertedRectDrawCall = null;

    constructor(colour:string){
        this.invertedRect = new Ed.InvertedRectDrawCall(colour);
        [this.MouseDown, this.MouseDrag, this.MouseUp].forEach(fn => fn.bind(this));
    }

    MouseDown(canvasPoint: Cam.Point): Ed.IDrawCall {
        this.p1 = this.p2 = canvasPoint;
        return this.GenRect();
    }
    MouseDrag(canvasPoint: Cam.Point): Ed.IDrawCall {
        this.p2 = canvasPoint;
        return this.GenRect();
    }
    MouseUp(canvasPoint: Cam.Point): Ed.IDrawCall {
        this.p2 = canvasPoint;
        return this.GenRect();
    }

    private GenRect(): Ed.InvertedRectDrawCall {
        this.invertedRect.SetPoints(this.p1, this.p2);
        return this.invertedRect;
    }
}


export class SegmentToolHandler implements IToolHandler{
    segment:Ed.SegmentDrawCall = null;
    width:number;
    colour:string;
    erase:boolean;
    constructor(width:number, colour:string, erase:boolean){
        this.width = width;
        this.colour = colour;
        this.erase = erase;
        [this.MouseDown, this.MouseDrag, this.MouseUp].forEach(fn => fn.bind(this));
    }

    MouseDown(canvasPoint: Cam.Point): Ed.IDrawCall {
        this.segment = new Ed.SegmentDrawCall(canvasPoint, this.width, this.colour, this.erase);
        return this.segment;
    }
    MouseDrag(canvasPoint: Cam.Point): Ed.IDrawCall {
        this.segment.AddEndPoint(canvasPoint, this.width);
        return this.segment;
    }
    MouseUp(canvasPoint: Cam.Point): Ed.IDrawCall {
        this.segment.AddEndPoint(canvasPoint, this.width);
        return this.segment;
    }
}
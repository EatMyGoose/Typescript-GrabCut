import * as Cam from "./Drawing2D";
import * as Mat from "../Matrix";
import * as T from "./Transform";

//Note: Manage 2 separate queues of drawcalls in order to keep track of what 
//to draw on the screen canvas and buffer canvas

export interface IDrawCall {
    Draw(hDC: CanvasRenderingContext2D): void;
    Transform(transform: Mat.Matrix): IDrawCall;
}

//TODO: add option for the global compositing property 
//to allow for the implementation of a XOR brush

export class HollowRectDrawCall implements IDrawCall {
    protected rect: Cam.Rect;
    protected colour: string;
    protected width: number;

    constructor(colour: string, width: number) {
        this.rect = null;
        this.colour = colour;
        this.width = width;
    }

    SetPoints(p1: Cam.Point, p2: Cam.Point) {
        this.rect = Cam.Points2Rect(p1, p2);
    }

    Draw(hDC: CanvasRenderingContext2D): void {
        if (this.rect == null) return;
        hDC.beginPath();

        hDC.strokeStyle = this.colour;
        hDC.lineWidth = this.width;
        let r = this.rect;
        hDC.rect(r.x, r.y, r.width, r.height);

        hDC.stroke();
    }

    Transform(transform: Mat.Matrix): IDrawCall {
        let scale = T.GetScalingFactor(transform)[0];
        let scaledWidth = this.width * scale;
        let transformed = new HollowRectDrawCall(this.colour, scaledWidth);
        transformed.rect = T.TransformRect(transform, this.rect);
        return transformed;
    }
}

export class InvertedRectDrawCall implements IDrawCall {
    protected rect: Cam.Rect;
    protected colour: string;

    constructor(colour: string) {
        this.rect = null;
        this.colour = colour;
    }

    SetPoints(p1: Cam.Point, p2: Cam.Point) {
        this.rect = Cam.Points2Rect(p1, p2);
    }

    Draw(hDC: CanvasRenderingContext2D): void {
        if (this.rect == null) return;
        let [width, height] = [hDC.canvas.width, hDC.canvas.height];
        let rectB = Cam.Rect2RectB(this.rect);
        /*
            |  Top  |
            |_______|
        Left| Rect  |Right
            |_______|
            |       |
            |  Bot  |
        */
        let leftRect = Cam.Points2Rect({ x: 0, y: 0 }, { x: rectB.left, y: height });
        let rightRect = Cam.Points2Rect({ x: rectB.right, y: 0 }, { x: width, y: height });
        let topRect = Cam.Points2Rect({ x: rectB.left, y: 0 }, { x: rectB.right, y: rectB.top });
        let botRect = Cam.Points2Rect({ x: rectB.left, y: rectB.bot }, { x: rectB.right, y: height });

        let drawRect = (r: Cam.Rect) => hDC.fillRect(r.x, r.y, r.width, r.height);

        hDC.beginPath();

        hDC.fillStyle = this.colour;
        drawRect(leftRect);
        drawRect(rightRect);
        drawRect(topRect);
        drawRect(botRect);

        hDC.stroke();
    }

    Transform(transform: Mat.Matrix): IDrawCall {
        let transformed = new InvertedRectDrawCall(this.colour);
        transformed.rect = T.TransformRect(transform, this.rect);
        return transformed;
    }
}

//Draws a series of interconnected lines
//Add new points to the existing segments via AddEndPoint()
export class SegmentDrawCall implements IDrawCall {
    protected segments: Cam.Point[] = [];
    protected widths: number[] = [];
    protected colour: string; //hexadecimal colour
    protected erase: boolean;

    constructor(start: Cam.Point, width: number, colour: string, erase: boolean) {
        this.segments.push(start);
        this.widths.push(width);
        this.colour = colour;
        this.erase = erase;
    }

    AddEndPoint(next: Cam.Point, width: number) {
        this.segments.push(next);
        this.widths.push(width);
    }

    Draw(hDC: CanvasRenderingContext2D): void {
        if (this.segments.length == 0) return;

        let originalCompositingMode = hDC.globalCompositeOperation;

        if (this.erase) {
            hDC.globalCompositeOperation = "destination-out";
        }

        hDC.beginPath();

        hDC.lineCap = "round";
        hDC.lineJoin = "round";
        hDC.strokeStyle = this.colour;

        hDC.moveTo(this.segments[0].x, this.segments[0].y);
        hDC.lineWidth = this.widths[0];

        for (let i = 1; i < this.segments.length; i++) {
            let seg = this.segments[i];
            hDC.lineTo(seg.x, seg.y);
            hDC.lineWidth = this.widths[i];
        }

        hDC.stroke();

        //Restore composition mode
        hDC.globalCompositeOperation = originalCompositingMode;
    }

    Transform(transform: Mat.Matrix): IDrawCall {
        let transformed = new SegmentDrawCall(null, null, this.colour, this.erase);
        let scale = T.GetScalingFactor(transform)[0];
        transformed.widths = this.widths.map(w => w * scale);
        transformed.segments = this.segments.map(seg => T.Apply2DTransform(seg, transform));
        return transformed;
    }
}


export class HollowCircleCall implements IDrawCall {
    private diameter: number;
    private centre: Cam.Point;
    constructor(start: Cam.Point, diameter: number) {
        this.diameter = diameter;
        this.centre = start;
    }

    UpdateLocation(centre: Cam.Point, diameter: number) {
        this.diameter = diameter;
        this.centre = centre;
    }

    Draw(hDC: CanvasRenderingContext2D): void {
        let originalCompositingMode = hDC.globalCompositeOperation;

        hDC.globalCompositeOperation = "xor";
        
        hDC.beginPath();
        hDC.strokeStyle = "#000000";

        hDC.lineWidth = 1;
        hDC.arc(this.centre.x, this.centre.y, this.diameter / 2, 0, 2 * Math.PI);
        hDC.stroke();

        //Restore composition mode
        hDC.globalCompositeOperation = originalCompositingMode;
    }

    Transform(transform: Mat.Matrix): IDrawCall {
        let scale = T.GetScalingFactor(transform)[0];
        let scaledDiameter = scale  * this.diameter;
        let transformedPoint = T.Apply2DTransform(this.centre, transform);
        return new HollowCircleCall(transformedPoint, scaledDiameter);
    }
}
 import * as Ed from "./Editor";

 export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RectB{
    left: number;
    right: number;
    top: number;
    bot: number;
}

export interface Point {
    x: number;
    y: number;
}

export const origin = { x: 0, y: 0 } as Point;

export function Rect2RectB(rect:Rect):RectB{
    return {
        left:rect.x,
        right:rect.x + rect.width,
        top: rect.y,
        bot: rect.y + rect.height
    };
} 

export function RectB2Rect(rectB:RectB):Rect{
    return{
        x: rectB.left,
        y: rectB.top,
        width: rectB.right - rectB.left,
        height: rectB.bot - rectB.top
    }
}

export function ClipRect(rect:Rect, boundary:Rect):Rect{
    let rectB = Rect2RectB(rect);
    let boundaryB = Rect2RectB(boundary);
    let clippedB = {
        left: Math.max(rectB.left, boundaryB.left),
        right: Math.min(rectB.right, boundaryB.right),
        top: Math.max(rectB.top, boundaryB.top),
        bot: Math.min(rectB.bot, boundaryB.bot)
    };
    return RectB2Rect(clippedB);
}

export function RelPos(clientX:number, clientY:number, target:Element){
    let boundingBox = target.getBoundingClientRect();
    let relPoint = 
        {x: clientX - boundingBox.x, 
        y: clientY - boundingBox.y} as Point;
    return relPoint;
}

export function Points2Rect(p1:Point, p2:Point):Rect{
    let [top, left] = [Math.min(p1.y, p2.y), Math.min(p1.x, p2.x)];
    let [bot, right] = [Math.max(p1.y, p2.y), Math.max(p1.x, p2.x)];
    let [height, width] = [(bot - top), (right - left)];
    return {
        x: left,
        y: top,
        width: width,
        height: height
    }
}

export function CanvasRect2BufferRect(
    canvasRect:Rect, drawRegion:Rect,
    bufferWidth:number, bufferHeight:number):Rect{

    let cRectB = Rect2RectB(canvasRect);

    let bufferTop = Canvas2Buffer(cRectB.left, cRectB.top, drawRegion, bufferWidth, bufferHeight);
    let bufferBot = Canvas2Buffer(cRectB.right, cRectB.bot, drawRegion, bufferWidth, bufferHeight);

    return Points2Rect(bufferTop, bufferBot);
}

export function BufferRect2CanvasRect(
    bufferRect:Rect, 
    bufferWidth:number, bufferHeight:number,
    clientRegion:Rect): Rect{
    
    let bufferRectB = Rect2RectB(bufferRect);

    let canvasTop = Buffer2Canvas(bufferRectB.left, bufferRectB.top, bufferWidth, bufferHeight, clientRegion);
    let canvasBot = Buffer2Canvas(bufferRectB.right, bufferRectB.bot, bufferWidth, bufferHeight, clientRegion);

    return Points2Rect(canvasTop, canvasBot);
}

export function Buffer2Canvas(
    bufferX: number, bufferY: number, 
    bufferWidth:number, bufferHeight:number, 
    clientRegion:Rect): Point{
    
    let [xFrac, yFrac] = [bufferX / bufferWidth, bufferY / bufferHeight];
    let clientX = clientRegion.x + xFrac * clientRegion.width;
    let clientY = clientRegion.y + yFrac * clientRegion.height;

    return {x:clientX, y:clientY} as Point;
}

export function Canvas2Buffer(
    clientX: number, clientY: number, clientRegion:Rect, 
    bufferWidth:number, bufferHeight:number): Point {

    let bufferX = ((clientX - clientRegion.x) / clientRegion.width) * bufferWidth;
    let bufferY = ((clientY - clientRegion.y) / clientRegion.height) * bufferHeight;
    return { x: bufferX, y: bufferY } as Point;
}

export function FitToRectangle(maxWidth: number, maxHeight: number, imgWidth: number, imgHeight: number): Rect {
    let [xScale, yScale] = [maxWidth / imgWidth, maxHeight / imgHeight];

    let minScale = Math.min(xScale, yScale);
    let scale = ((minScale) < 1) ? minScale : 1.0; //If the image can fit within the rect without downscaling, don't upscale it

    let w = imgWidth * scale;
    let h = imgHeight * scale;

    // Centre image
    let x = (maxWidth - w) / 2;
    let y = (maxHeight - h) / 2;
    return { x: x, y: y, width: w, height: h } as Rect;
}
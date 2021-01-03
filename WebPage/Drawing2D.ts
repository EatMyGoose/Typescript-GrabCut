export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RectB {
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

export function Rect2RectB(rect: Rect): RectB {
    return {
        left: rect.x,
        right: rect.x + rect.width,
        top: rect.y,
        bot: rect.y + rect.height
    };
}

export function RectB2Rect(rectB: RectB): Rect {
    return {
        x: rectB.left,
        y: rectB.top,
        width: rectB.right - rectB.left,
        height: rectB.bot - rectB.top
    }
}

export function ClipRect(rect: Rect, boundary: Rect): Rect {
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

export function RelPos(clientX: number, clientY: number, target: Element) {
    let boundingBox = target.getBoundingClientRect();
    let relPoint =
        {
            x: clientX - boundingBox.x,
            y: clientY - boundingBox.y
        } as Point;
    return relPoint;
}

export function Points2Rect(p1: Point, p2: Point): Rect {
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

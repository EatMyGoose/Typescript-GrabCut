import * as M from "../Matrix";
import * as Cam from "./Drawing2D";

function Is3x3(mat: M.Matrix): boolean {
    return M.OfDimensions(mat, 3, 3);
}

function Is2DAffineColVector(mat: M.Matrix): boolean {
    return M.OfDimensions(mat, 3, 1);
}

export function TransformRect(transform:M.Matrix, rect:Cam.Rect): Cam.Rect{
    let topLeft = {x:rect.x, y:rect.y}
    let botRight = {x:rect.x + rect.width, y: rect.y + rect.height};
    let transTopLeft = Apply2DTransform(topLeft, transform);
    let transBotRight = Apply2DTransform(botRight, transform);
    return Cam.Points2Rect(transTopLeft, transBotRight);
}

export function GetScalingFactor(affineMat:M.Matrix): [number,number]{
    return [affineMat[0][0], affineMat[1][1]]; //[xScale, yScale]
}

export function Scale2D(xScale: number, yScale: number): M.Matrix {
    let trans = M.Identity(3);
    trans[0][0] = xScale;
    trans[1][1] = yScale;
    return trans;
}


export function Translate2D(xTranslation: number, yTranslation: number): M.Matrix {
    let trans = M.Identity(3);
    trans[0][2] = xTranslation;
    trans[1][2] = yTranslation;
    return trans;
}

export function Point2AffinePoint(point: Cam.Point): M.Matrix {
    let m = M.CreateMatrix(3, 1);
    m[0][0] = point.x;
    m[1][0] = point.y;
    m[2][0] = 1;
    return m;
}

export function AffinePoint2Point(col: M.Matrix): Cam.Point {
    if (!Is2DAffineColVector(col)) throw new Error(`Input needs to be a 3x1 column vector, actual:${col}`);

    return {
        x: col[0][0],
        y: col[1][0]
    }
}

//Gives the final transformation & inverse
export function ChainTransform(...transformations: M.Matrix[]): [M.Matrix, M.Matrix] {
    let not2DAffineTransform =
        transformations
            .filter(t => !Is3x3(t))
            .length > 0;

    if (not2DAffineTransform) throw new Error("Transformations must be 3x3 2d affine transform matrices");

    let trans = M.Identity(3);
    for (let i = 0; i < transformations.length; i++) {
        trans = M.Mul(trans, transformations[i]);
    }

    return [trans, M.Inverse(trans)];
}

export function Apply2DTransform(point: Cam.Point, ...transformations: M.Matrix[]): Cam.Point {
    if (transformations.length == 0) return point;

    let [trans, _ ] = ChainTransform(...transformations);
    let prod = M.Mul(trans, Point2AffinePoint(point));

    return AffinePoint2Point(prod);
}
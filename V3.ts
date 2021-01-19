import * as M from "./Matrix";

//Matrix functions written specifically for 3d column vectors

export function Sub(v1 :M.Matrix, v2 :M.Matrix):M.Matrix{
    let res = new Array(3);
    res[0] = [v1[0][0] - v2[0][0]];
    res[1] = [v1[1][0] - v2[1][0]];
    res[2] = [v1[2][0] - v2[2][0]];
    return res;
}

//acc = acc - v2
export function SubInPlace(acc: M.Matrix, v2:M.Matrix):void{
    acc[0][0] -= v2[0][0];
    acc[1][0] -= v2[1][0];
    acc[2][0] -= v2[2][0];
}

export function AddInPlace(acc: M.Matrix, v2:M.Matrix):void{
    acc[0][0] += v2[0][0];
    acc[1][0] += v2[1][0];
    acc[2][0] += v2[2][0];
}

export function NormSquare(vec:M.Matrix):number{
    let e0 = vec[0][0];
    let e1 = vec[1][0];
    let e2 = vec[2][0];
    return e0 * e0 + e1 * e1 + e2 * e2;
}

export function Norm(vec:M.Matrix):number{
    let e0 = vec[0][0];
    let e1 = vec[1][0];
    let e2 = vec[2][0];
    return Math.sqrt(e0 * e0 + e1 * e1 + e2 * e2);
}

export function DiffNormSquare(v1:M.Matrix, v2:M.Matrix):number{
    let e0 = v1[0][0] - v2[0][0];
    let e1 = v1[1][0] - v2[1][0];
    let e2 = v1[2][0] - v2[2][0];
    return e0 * e0 + e1 * e1 + e2 * e2;
}

export function isV3(v:M.Matrix):boolean{
    return  M.IsColumnVector(v) && M.Rows(v) == 3;
}
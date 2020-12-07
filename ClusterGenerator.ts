import * as Util from "./Utility";
import * as Mat from "./Matrix";

export function UniformClusters(mean:Mat.Matrix, spread:Mat.Matrix, nPoints:number):Mat.Matrix[]{
    let lower = Mat.Scale(-1, spread);
    let upper = spread;
    let points = Util.FillObj<Mat.Matrix>(nPoints, () => Mat.Clone(mean));

    for(let i  = 0; i < nPoints; i++){
        let randomOffsets = Mat.RandomFill(lower, upper);
        Mat.AddInPlace(points[i], randomOffsets);
    }
    return points;
}
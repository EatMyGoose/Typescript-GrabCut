import * as M from "./Matrix";

class Params {
    readonly dim: number;
    readonly pi: number; //weight;
    readonly mean: M.Matrix;
    readonly covariance: M.Matrix;
    readonly covarianceDet: number;
    readonly covarianceInv: M.Matrix;
    readonly coeff: number;

    constructor(_pi: number, _mean: M.Matrix, _covariance: M.Matrix) {
        this.pi = _pi;
        this.mean = _mean;

        const epsilon = 1e-7;

        //Determinant may be zero if all sample points are identical (i.e. no covariance)
        //Add a scaled identity matrix to allow an inverse to be calculated.
        if (Math.abs(M.Determinant(_covariance)) < epsilon) {
            let dim = M.Rows(_covariance);

            let epsMat = M.Scale(epsilon, M.Identity(dim));
            _covariance = M.Add(_covariance, epsMat);
        }
        this.covariance = _covariance;
        this.covarianceDet = M.Determinant(_covariance);
        this.covarianceInv = M.Inverse(_covariance);
        this.dim = Math.max(...M.Dimensions(_mean));

        let coeffDenominator = Math.sqrt(Math.pow(2 * Math.PI, this.dim) * Math.abs(this.covarianceDet));
        this.coeff = this.pi * (1 / coeffDenominator);

        //#region "Error checking"

        let scalars = [this.dim, this.pi, this.covarianceDet];
        let anyScalarNaN = scalars.filter(s => isNaN(s)).length > 0;

        let matrices = [this.mean, this.covariance, this.covarianceInv];
        let anyMatricesNaN = matrices.filter(m => M.Any(m, e => isNaN(e))).length > 0;

        if (anyScalarNaN || anyMatricesNaN) {
            console.log({
                dim: this.dim,
                pi: this.pi,
                covarianceDet: this.covarianceDet
            });
            console.log({
                mean: this.mean,
                covariance: this.covariance,
                covarianceInv: this.covarianceInv
            });
            throw new Error("NaN in GMM cluster");
        }
        //#endregion "Error checking"
    }
}

export interface ICluster{
    Likelihood(observation: M.Matrix): number;
}

export class Cluster{
    private params;
    constructor(_pi: number, _mean: M.Matrix, _covariance: M.Matrix){
        this.params = new Params(_pi, _mean, _covariance);
    }

    Likelihood(observation: M.Matrix): number {
        let diff = M.Sub(observation, this.params.mean);
        let diff_Transposed = M.Transpose(diff);
        let exponentMat = M.Mul(M.Mul(diff_Transposed, this.params.covarianceInv), diff);
        let exponent = -0.5 * exponentMat[0][0];
        let result = this.params.coeff * Math.exp(exponent);
        //Likelihood should always be positive, no need to check for negative infinity
        result = isFinite(result) ? result : Number.MAX_SAFE_INTEGER;
    
        return result;
    }
}

export function ClusterFactory(_pi: number, _mean: M.Matrix, _covariance: M.Matrix): ICluster{
    let dim = Math.max(...M.Dimensions(_mean));
    if(dim == 3){
        return new V3Cluster(_pi, _mean, _covariance); 
    }else{
        return new Cluster(_pi, _mean, _covariance);
    }
}

//Optimized for clusters of 3 dimensional data
export class V3Cluster{
    private params;
    constructor(_pi: number, _mean: M.Matrix, _covariance: M.Matrix){
        this.params = new Params(_pi, _mean, _covariance);
    }

    Likelihood(observation: M.Matrix): number {
        let diff = M.Sub(observation, this.params.mean);
        let diff_Transposed = M.Transpose(diff);
        let exponentMat = Mul_h3_3by3_v3(diff_Transposed, this.params.covarianceInv, diff);
        let exponent = -0.5 * exponentMat;
        let result = this.params.coeff * Math.exp(exponent);
        //Likelihood should always be positive, no need to check for negative infinity
        result = isFinite(result) ? result : Number.MAX_SAFE_INTEGER;
    
        return result;
    }
}

function Mul_h3_3by3_v3(h3:M.Matrix, _3by3: M.Matrix, v3:M.Matrix):number{
    let c0 = h3[0][0] * _3by3[0][0] + h3[0][1] * _3by3[1][0] + h3[0][2] * _3by3[2][0];
    let c1 = h3[0][0] * _3by3[0][1] + h3[0][1] * _3by3[1][1] + h3[0][2] * _3by3[2][1];
    let c2 = h3[0][0] * _3by3[0][2] + h3[0][1] * _3by3[1][2] + h3[0][2] * _3by3[2][2];

    return c0 * v3[0][0] + c1 * v3[1][0] + c2 * v3[2][0]
}
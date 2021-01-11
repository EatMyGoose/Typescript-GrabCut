import * as Util from "./Utility";
import * as Mat from "./Matrix";
import * as KM from "./KMeans";
import * as Conv from "./ConvergenceChecker";
import * as C from "./GMMCluster";

/*
export class GMMCluster {
    readonly dim: number;
    readonly pi: number; //weight;
    readonly mean: Mat.Matrix;
    readonly covariance: Mat.Matrix;
    readonly covarianceDet: number;
    readonly covarianceInv: Mat.Matrix;

    private coeff: number;

    constructor(_pi: number, _mean: Mat.Matrix, _covariance: Mat.Matrix) {
        this.pi = _pi;
        this.mean = _mean;

        const epsilon = 1e-7;

        //Determinant may be zero if all sample points are identical (i.e. no covariance)
        //Add a scaled identity matrix to allow an inverse to be calculated.
        if (Math.abs(Mat.Determinant(_covariance)) < epsilon) {
            let dim = Mat.Rows(_covariance);

            let epsMat = Mat.Scale(epsilon, Mat.Identity(dim));
            _covariance = Mat.Add(_covariance, epsMat);
        }
        this.covariance = _covariance;
        this.covarianceDet = Mat.Determinant(_covariance);
        this.covarianceInv = Mat.Inverse(_covariance);
        this.dim = Math.max(...Mat.Dimensions(_mean));

        let coeffDenominator = Math.sqrt(Math.pow(2 * Math.PI, this.dim) * Math.abs(this.covarianceDet));
        this.coeff = this.pi * (1 / coeffDenominator);

        //#region "Error checking"

        let scalars = [this.dim, this.pi, this.covarianceDet];
        let anyScalarNaN = scalars.filter(s => isNaN(s)).length > 0;

        let matrices = [this.mean, this.covariance, this.covarianceInv];
        let anyMatricesNaN = matrices.filter(m => Mat.Any(m, e => isNaN(e))).length > 0;

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

    //Multivariate normal * weight of the gaussian
    Likelihood(observation: Mat.Matrix): number {
        let diff = Mat.Sub(observation, this.mean);
        let diff_Transposed = Mat.Transpose(diff);
        let exponentMat = Mat.Mul(Mat.Mul(diff_Transposed, this.covarianceInv), diff);
        let exponent = -0.5 * exponentMat[0][0];
        let result = this.coeff * Math.exp(exponent);
        //Likelihood should always be positive, no need to check for negative infinity
        result = isFinite(result) ? result : Number.MAX_SAFE_INTEGER;
    
        return result;
    }
}
*/

export enum Initializer {
    random,
    KMeansPlusPlus
}

export class GMMResult {
    likelihoods: number[];

    constructor(likelihoods: number[]) {
        this.likelihoods = likelihoods;
    }

    TotalLikelihood(): number {
        return Util.Sum(this.likelihoods);
    }

    //Expresses all likelihoods as a fraction of the highest likelihood
    Normalized(): number[] {
        let max = Util.Max(this.likelihoods);
        return this.likelihoods.map(l => l / max);
    }
}

export class GMM {
    //clusters: GMMCluster[];
    clusters: C.ICluster[];

    //TODO: remove parameters for constructor (Fit can calculate all of the relevant params)
    constructor() {

    }

    Fit(rawData: Mat.Matrix[], nClusters: number, init: Initializer = Initializer.KMeansPlusPlus, MAX_ITER: number = 20, MIN_PERCENT_CHANGE: number = 1): void {
        if (!Mat.IsVector(rawData[0])) {
            throw new Error(`GMM.Fit: Error, data points need to be vectors (ideally column vectors)`);
        }

        //Will be converted to column vectors if necessary
        let data = rawData;

        if (Mat.IsRowVector(rawData[0])) {
            data = rawData.map(m => Mat.Transpose(m));
        }

        console.log("GMM:Init Clusters");
        //Init Clusters
        let newClusters: C.ICluster[];
        switch (init) {
            case Initializer.random: {
                newClusters = this.RandomInit(data, nClusters);
                break;
            }
            case Initializer.KMeansPlusPlus: {
                let kMeansResult = KM.Fit(data, nClusters, 20, 1, KM.Initializer.KMeansPlusPlus);
                let nonEmptyClusters = kMeansResult.clusters.filter(c => c.length > 0);
                newClusters = nonEmptyClusters.map(c => GMM.Points2GMMCluster(c, data.length));
                break;
            }
        }

        console.log("GMM:EM-start");
        //EM-Iteration
        let conv = new Conv.ConvergenceChecker(MIN_PERCENT_CHANGE, MAX_ITER);
        let logProb: number;
        do {
            newClusters = this.EM(data, newClusters);
            logProb = GMM.LogLikelihood(data, newClusters);
            console.log(`Iteration:${conv.getCurrentIter()}, logProb:${logProb}`);
        } while (!conv.hasConverged(logProb));

        this.clusters = newClusters;
    }

    Predict(rawData: Mat.Matrix): GMMResult {
        let data = Mat.IsColumnVector(rawData) ? rawData : Mat.Transpose(rawData);
        let predictions = new Array(this.clusters.length);
        for (let i = 0; i < predictions.length; i++) {
            predictions[i] = this.clusters[i].Likelihood(data);
        }
        return new GMMResult(predictions);
    }

    private RandomInit(data: Mat.Matrix[], nClusters: number): C.ICluster[] {
        let nDim = Mat.Rows(data[0]);
        let selectedIndices = Util.UniqueRandom(nClusters, data.length - 1);
        let equalWeightage = 1 / nClusters;
        return selectedIndices.map(i => {
            return C.ClusterFactory(equalWeightage, data[i], Mat.Identity(nDim));
        });
    }

    //data: column vectors of each observation
    private EM(data: Mat.Matrix[], initialClusters: C.ICluster[]): C.ICluster[] {

        let ReplaceZeroes = (arr: number[], lowerThreshold: number): void => {
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] < lowerThreshold) arr[i] = lowerThreshold;
            }
        };

        if (data.length == 0) {
            throw new Error("Empty data set");
        }

        let nDataPoints = data.length;
        let nDims = Mat.Rows(data[0]);
        let nClusters = initialClusters.length;

        //Rows: stores the probabilities of the nth cluster
        //Columns: probabilities of x-th observation for the n-th cluster
        let prob = Mat.CreateMatrix(nClusters, nDataPoints);
        let probSum = Util.Fill<number>(data.length, 0);

        //http://www.cse.iitm.ac.in/~vplab/courses/DVP/PDF/gmm.pdf

        for (let c = 0; c < nClusters; c++) {
            let currentCluster = initialClusters[c];
            for (let d = 0; d < nDataPoints; d++) {
                let p = currentCluster.Likelihood(data[d]);
                if (isNaN(p)) {
                    console.log(currentCluster);
                    throw new Error("NaN");
                }
                prob[c][d] = p;
                probSum[d] += p;
            }
        }

        //Scan total probabilities for zero
        //Replace zeroes with a small value to prevent div by zero errors
        const eps = 1e-9;
        ReplaceZeroes(probSum, eps);

        let resp = Mat.CreateMatrix(nClusters, nDataPoints);
        let clusterResp = Util.Fill<number>(nClusters, 0);
        for (let c = 0; c < nClusters; c++) {
            for (let d = 0; d < nDataPoints; d++) {
                let r = prob[c][d] / probSum[d];
                resp[c][d] = r;
                clusterResp[c] += r;
            }
        }

        ReplaceZeroes(clusterResp, eps);

        //console.log(clusterResp);

        //Recluster
        //Means
        let clusterSum =
            Util
                .FillObj<Mat.Matrix>(nClusters, () => Mat.CreateMatrix(nDims, 1));

        for (let c = 0; c < nClusters; c++) {
            for (let d = 0; d < nDataPoints; d++) {
                let contribution = Mat.Scale(resp[c][d], data[d]);
                Mat.AddInPlace(clusterSum[c], contribution);
            }
            if (Mat.Any(clusterSum[c], e => isNaN(e))) {
                throw new Error("cluster sum NaN");
            }
        }

        let means =
            clusterSum
                .map((sum, index) => Mat.Scale(1 / clusterResp[index], sum));

        //Weights
        let weights = clusterResp.map(x => x / nDataPoints);

        //Covariances        
        let covAcc =
            Util
                .FillObj<Mat.Matrix>(nClusters, () => Mat.CreateMatrix(nDims, nDims));

        for (let c = 0; c < nClusters; c++) {
            for (let d = 0; d < nDataPoints; d++) {
                let diff = Mat.Sub(data[d], means[c]);
                let diffTransposed = Mat.Transpose(diff);
                let contribution = Mat.Scale(resp[c][d], Mat.Mul(diff, diffTransposed));
                Mat.AddInPlace(covAcc[c], contribution);
            }
        }

        let covariances =
            covAcc.map((cov, ind) => Mat.Scale(1 / clusterResp[ind], cov));

        //Return new GMM cluster hyperparameters
        return means.map((_, cIndex) => {
            return C.ClusterFactory(weights[cIndex], means[cIndex], covariances[cIndex]);
        });
    }

    //Returns the fg and bg GMMS
    static labelledDataToGMMs(
        fgLabels: number[], fgGroupSize: number[],
        bgLabels: number[], bgGroupSize: number[],
        labels: number[], data: Mat.Matrix[]): [GMM, GMM] {

        let fgGMM = new GMM();
        let bgGMM = new GMM();

        let createCluster = (_tags: number[], _groupSizes: number[]) => {
            let totalPoints = Util.Sum(_groupSizes);
            return _tags.map((t,ind) => {
                let groupSize = _groupSizes[ind];
                let pi = groupSize / totalPoints;
                let params = Mat.MeanAndCovarianceFromLabelledData(t, labels, data);
                return C.ClusterFactory(pi, params.mean, params.covariance);
            });
        }

        fgGMM.clusters = createCluster(fgLabels, fgGroupSize);
        bgGMM.clusters = createCluster(bgLabels, bgGroupSize);

        return [fgGMM, bgGMM];
    }

    static PreclusteredDataToGMM(clusteredData: Mat.Matrix[][]): GMM {
        let gmm = new GMM();
        let totalPoints = Util.Sum(clusteredData.map(c => c.length));
        gmm.clusters = clusteredData.map(c => GMM.Points2GMMCluster(c, totalPoints));
        return gmm;
    }

    //Helper function for calculating initial GMMs
    private static Points2GMMCluster(data: Mat.Matrix[], dataPointsInGMMSet: number): C.ICluster {
        if (data.length == 0) {
            throw new Error("GMM cluster cannot be empty");
        }
        let nData = data.length;
        let weight = nData / dataPointsInGMMSet;
        let params = Mat.MeanAndCovariance(data);
        return C.ClusterFactory(weight, params.mean, params.covariance);
    }

    //data: column vectors of each observation
    static LogLikelihood(data: Mat.Matrix[], gmm: C.ICluster[]): number {
        let logProb = 0;
        for (let d = 0; d < data.length; d++) {
            let acc = 0;
            for (let c = 0; c < gmm.length; c++) {
                acc += gmm[c].Likelihood(data[d]);
            }
            logProb += Math.log(acc);
        }
        return logProb;
    }
}

import * as Util from "./Utility";
import * as Mat from "./Matrix";
import * as KM from "./KMeans";
import * as Conv from "./ConvergenceChecker";
import * as C from "./GMMCluster";

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
    clusters: C.ICluster[];

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

        console.time("GMM:Init Clusters");
        //Init Clusters
        let newClusters: C.ICluster[];
        switch (init) {
            case Initializer.random: {
                newClusters = this.RandomInit(data, nClusters);
                break;
            }
            case Initializer.KMeansPlusPlus: {
                console.time("KMeans");
                let kMeansResult = KM.Fit(data, nClusters, 20, 1, KM.Initializer.KMeansPlusPlus);
                let nonEmptyClusters = kMeansResult.clusters.filter(c => c.length > 0);
                console.timeEnd("KMeans");
                console.time("Points2GMM");
                newClusters = nonEmptyClusters.map(c => GMM.Points2GMMCluster(c, data.length));
                console.timeEnd("Points2GMM");
                break;
            }
        }
        console.timeEnd("GMM:Init Clusters");

        console.log("GMM:EM-start");
        //EM-Iteration
        let conv = new Conv.ConvergenceChecker(MIN_PERCENT_CHANGE, MAX_ITER);
        let logProb: number;
        do {
            newClusters = EM(data, newClusters);
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

    //Returns the fg and bg GMMS
    static labelledDataToGMMs(
        fgLabels: number[], fgGroupSize: number[],
        bgLabels: number[], bgGroupSize: number[],
        labels: number[], data: Mat.Matrix[]): [GMM, GMM] {

        let fgGMM = new GMM();
        let bgGMM = new GMM();

        let createCluster = (_tags: number[], _groupSizes: number[]) => {
            let totalPoints = Util.Sum(_groupSizes);
            return _tags.map((t, ind) => {
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


//data: column vectors of each observation
function EM(data: Mat.Matrix[], initialClusters: C.ICluster[]): C.ICluster[] {

    let ReplaceZeroes = (arr: number[], lowerThreshold: number): void => {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] < lowerThreshold) arr[i] = lowerThreshold;
        }
    };

    if (data.length == 0) {
        throw new Error("Empty data set");
    }

    console.time("EM-init");
    let nDataPoints = data.length;
    let nDims = Mat.Rows(data[0]);
    let nClusters = initialClusters.length;

    //Rows: stores the probabilities of the nth cluster
    //Columns: probabilities of x-th observation for the n-th cluster
    let prob = Mat.CreateMatrix(nClusters, nDataPoints);
    let probSum = Util.Fill<number>(data.length, 0);

    //http://www.cse.iitm.ac.in/~vplab/courses/DVP/PDF/gmm.pdf

    console.time("EM-Likelihood-eval");
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

    console.timeEnd("EM-Likelihood-eval");

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

    console.timeEnd("EM-init");

    //Recluster
    //Means
    let clusterSum =
        Util
            .FillObj<Mat.Matrix>(nClusters, () => Mat.CreateMatrix(nDims, 1));

    console.time("EM-Resp-Sum");

    let fnSumResp:sumRespDelegate = (nDims == 3) ? SumResponsibilityV3 : SumResponsibilityGeneric;

    fnSumResp(data, clusterSum, resp, nClusters);

    for (let c = 0; c < nClusters; c++) {
        if (Mat.Any(clusterSum[c], e => isNaN(e))) {
            throw new Error("cluster sum NaN");
        }
    }

    console.timeEnd("EM-Resp-Sum");

    let means =
        clusterSum
            .map((sum, index) => Mat.Scale(1 / clusterResp[index], sum));

    //Weights
    let weights = clusterResp.map(x => x / nDataPoints);

    //Covariances        
    let covAcc = Util.FillObj<Mat.Matrix>(nClusters, () => Mat.CreateMatrix(nDims, nDims));

    console.time("EM-cov-cal");

    let fnCovSum:covSumDelegate = (nDims == 3) ? sumCovarianceV3 : sumCovarianceGeneric;
    fnCovSum(data, nClusters, means, resp, covAcc);

    console.timeEnd("EM-cov-cal");

    let covariances =
        covAcc.map((cov, ind) => Mat.Scale(1 / clusterResp[ind], cov));

    //Return new GMM cluster hyperparameters
    return means.map((_, cIndex) => {
        return C.ClusterFactory(weights[cIndex], means[cIndex], covariances[cIndex]);
    });
}

//#region summation of responsibilities
type sumRespDelegate = (_data: Mat.Matrix[], _clusterSum: Mat.Matrix[], _resp: number[][], _nClusters: number) => void;
 
function SumResponsibilityGeneric(_data: Mat.Matrix[], _clusterSum: Mat.Matrix[], _resp: number[][], _nClusters: number) {
    for (let c = 0; c < _nClusters; c++) {
        for (let d = 0; d < _data.length; d++) {
            let contribution = Mat.Scale(_resp[c][d], _data[d]);
            Mat.AddInPlace(_clusterSum[c], contribution);
        }
    }
}

function SumResponsibilityV3(_data: Mat.Matrix[], _clusterSum: Mat.Matrix[], _resp: number[][], _nClusters: number) {
    for (let c = 0; c < _nClusters; c++) {
        for (let d = 0; d < _data.length; d++) {
            let dest = _clusterSum[c];
            let scale = _resp[c][d];
            let data = _data[d];

            dest[0][0] += scale * data[0][0];
            dest[1][0] += scale * data[1][0];
            dest[2][0] += scale * data[2][0];
        }
    }
}

//#endregion summation of responsibilities

//#region summation of covariances

type covSumDelegate = (data: Mat.Matrix[], nClusters: number, means: Mat.Matrix[], resp:number[][], covAcc: Mat.Matrix[]) => void;

function sumCovarianceGeneric(_data: Mat.Matrix[], _nClusters: number, _means: Mat.Matrix[], _resp:number[][], _covAcc: Mat.Matrix[]) {
    for (let c = 0; c < _nClusters; c++) {
        for (let d = 0; d < _data.length; d++) {
            let diff = Mat.Sub(_data[d], _means[c]);
            let diffTransposed = Mat.Transpose(diff);
            let contribution = Mat.Scale(_resp[c][d], Mat.Mul(diff, diffTransposed));
            Mat.AddInPlace(_covAcc[c], contribution);
        }
    }
}

function sumCovarianceV3(_data: Mat.Matrix[], _nClusters: number, _means: Mat.Matrix[], _resp:number[][], _covAcc: Mat.Matrix[]) {
    for (let c = 0; c < _nClusters; c++) {
        for (let d = 0; d < _data.length; d++) {
            let v3 = _data[d];
            let m = _means[c];

            let e0 = v3[0][0] - m[0][0];
            let e1 = v3[1][0] - m[1][0];
            let e2 = v3[2][0] - m[2][0];

            let scale = _resp[c][d];

            let dest = _covAcc[c];

            //Add in place
            let r0 = dest[0];
            r0[0] += scale * e0 * e0;
            r0[1] += scale * e0 * e1;
            r0[2] += scale * e0 * e2;

            let r1 = dest[1];
            r1[0] += scale * e1 * e0;
            r1[1] += scale * e1 * e1;
            r1[2] += scale * e1 * e2;

            let r2 = dest[2];
            r2[0] += scale * e2 * e0;
            r2[1] += scale * e2 * e1;
            r2[2] += scale * e2 * e2;
        }
    }
}

//#endregion summation of covariances
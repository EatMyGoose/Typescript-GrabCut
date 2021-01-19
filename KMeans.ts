import * as Util from './Utility';
import * as Mat from "./Matrix";
import { Dictionary } from './Collections';
import * as Conv from './ConvergenceChecker';
import * as V3 from "./V3";

export class KMeansResult {
    readonly clusters: Mat.Matrix[][];
    readonly means: Mat.Matrix[];
    private meanDist: number = -1;

    constructor(_clusters: Mat.Matrix[][], _means: Mat.Matrix[]) {
        this.clusters = _clusters;
        this.means = _means;
    }

    MeanDistanceToCluster(): number {
        if (this.meanDist >= 0) return this.meanDist;

        let nElems = Util.Sum(this.clusters.map(c => c.length));

        let first = this.means[0];
        let isV3 = V3.isV3(first);

        function GenericDist(_means:Mat.Matrix[], _clusters:Mat.Matrix[][]): number {
            let distAcc = 0;

            _clusters.forEach((c, ind) => {
                let clusterMean = _means[ind];
                for (let i = 0; i < c.length; i++) {
                    let diff = Mat.Sub(c[i], clusterMean);
                    distAcc += Mat.Norm(diff);
                }
            });
            return distAcc / nElems;
        }

        function V3Dist (_means:Mat.Matrix[], _clusters:Mat.Matrix[][]): number {
            let distAcc = 0;

            _clusters.forEach((c, ind) => {
                let clusterMean = _means[ind];
                for (let i = 0; i < c.length; i++) {
                    distAcc += Math.sqrt(V3.DiffNormSquare(c[i], clusterMean));
                }
            });
            return distAcc / nElems;
        }

        let fnDist = (isV3)? V3Dist: GenericDist;
        this.meanDist = fnDist(this.means, this.clusters);
        return this.meanDist;
    }
}

export enum Initializer {
    random,
    KMeansPlusPlus
}


//Returns [distinctClustersFound:boolean, clusterCenters:Mat.Matrix[]]
//distinctClustersFound is false if all values in data are equal.

function kMeansPlusPlusInit(nClusters: number, data: Mat.Matrix[]): [boolean, Mat.Matrix[]] {
    let selected = new Dictionary<boolean>();
    let firstIndex = Math.floor(Math.random() * (data.length - 1));
    selected.Set(firstIndex, true);
    let centres: Mat.Matrix[] = [data[firstIndex]];

    let prob: number[] = new Array(data.length);
    let cumProb: number[] = new Array(data.length);

    let isV3 = V3.isV3(data[0]);

    let fnDiffSquare = (isV3)? 
        V3.DiffNormSquare : 
        function(v1:Mat.Matrix, v2:Mat.Matrix) {return Mat.NormSquare(Mat.Sub(v1, v2))};

    while (centres.length < nClusters) {
        //Probability proportional to square of distance from closest centre
        for (let i = 0; i < data.length; i++) {
            let minDist = Number.MAX_VALUE;
            for (let c = 0; c < centres.length; c++) {
                let dist = fnDiffSquare(data[i], centres[c]);
                if (dist < minDist) {
                    minDist = dist;
                }
            }
            prob[i] = minDist;
        }

        let acc = 0;

        for (let i = 0; i < prob.length; i++) {
            acc += prob[i];
            cumProb[i] = acc;
        }

        let max = cumProb[cumProb.length - 1];

        if (max == 0) { //All values are equal (hence max = 0)
            let equalCentres = new Array(nClusters);
            for (let i = 0; i < nClusters; i++) equalCentres[i] = data[firstIndex];
            return [false, equalCentres];
        }

        let selectedIndex = 0;
        do {
            let rand = Math.random() * max;
            //TODO: could potentially use a binary search here
            for (let i = 0; i < cumProb.length; i++) {
                if (cumProb[i] >= rand) {
                    selectedIndex = i;
                    break;
                }
            }
        } while (selected.ContainsKey(selectedIndex));

        selected.Set(selectedIndex, true);
        centres.push(data[selectedIndex]);
    }
    return [true, centres];
}

//Expects column vectors as inputs
export function Fit(
    data: Mat.Matrix[], nClusters: number,
    nIter: number = 100, minPercentChange: number = 1, init: Initializer = Initializer.KMeansPlusPlus): KMeansResult {

    //if (!Mat.IsColumnVector(data[0])) throw new Error('KMeans: data needs to be an array of column vectors');

    let [nRows, nCols] = Mat.Dimensions(data[0]);
    //Init;
    let uniqueClusters: boolean;
    let clusterCentres: Mat.Matrix[];

    let isV3 = V3.isV3(data[0]);

    if (init == Initializer.random) {
        clusterCentres = Util.UniqueRandom(nClusters, data.length - 1).map(i => data[i]);
        //Check if the clusters are different from each other
        let interClusterDistances = clusterCentres.map(c => {
            let diff = Mat.Sub(clusterCentres[0], c);
            return Mat.NormSquare(diff);
        });
        let totalInterClusterDist = Util.Sum(interClusterDistances);
        uniqueClusters = totalInterClusterDist > 0;
    } else {
        //KMeans++
        [uniqueClusters, clusterCentres] = kMeansPlusPlusInit(nClusters, data);
    }

    let conv = new Conv.ConvergenceChecker(minPercentChange, nIter);
    let result: KMeansResult;
    let clusters = GroupToNearestMean(data, clusterCentres);

    do {
        //Assignment

        //Recomputation of means
        let fnAdd = (isV3)? V3.AddInPlace : Mat.AddInPlace;
        clusterCentres = clusters.map(c => {
            let acc = Mat.CreateMatrix(nRows, nCols);
            for (let i = 0; i < c.length; i++) {
                fnAdd(acc, c[i]);
            }
            return Mat.Scale(1 / c.length, acc);
        })

        clusters = GroupToNearestMean(data, clusterCentres);
        result = new KMeansResult(clusters, clusterCentres);
    } while (!conv.hasConverged(result.MeanDistanceToCluster()))

    console.log(`KMeans exited at ${conv.getCurrentIter()}`);
    return result;
}

function GroupToNearestMean(data: Mat.Matrix[], means: Mat.Matrix[]): Mat.Matrix[][] {
    let nClusters = means.length;
    let clusters: Mat.Matrix[][] = Util.FillObj(nClusters, () => []);

    let isV3 = V3.isV3(data[0]);

    function GenericGroup(_clusterBuffer: Mat.Matrix[][], _data:Mat.Matrix[], _means:Mat.Matrix[]):Mat.Matrix[][]{
        for (let d = 0; d < _data.length; d++) {
            let [maxDist, clusterInd] = [Number.MAX_VALUE, -1]
            for (let m = 0; m < _means.length; m++) {
                let diff = Mat.Sub(_data[d], _means[m]);
                let dist = Mat.NormSquare(diff);
                if (dist < maxDist) {
                    maxDist = dist;
                    clusterInd = m;
                }
            }
            _clusterBuffer[clusterInd].push(_data[d]);
        }
        return _clusterBuffer;
    }

    function V3Group(_clusterBuffer: Mat.Matrix[][], _data:Mat.Matrix[], _means:Mat.Matrix[]):Mat.Matrix[][]{
        for (let d = 0; d < _data.length; d++) {
            let [maxDist, clusterInd] = [Number.MAX_VALUE, -1]
            for (let m = 0; m < _means.length; m++) {
                let dist = V3.DiffNormSquare(_data[d], _means[m]);
                if (dist < maxDist) {
                    maxDist = dist;
                    clusterInd = m;
                }
            }
            _clusterBuffer[clusterInd].push(_data[d]);
        }
        return _clusterBuffer;
    }
    let fnGroup = (isV3)? V3Group: GenericGroup;
    return fnGroup(clusters, data, means);
}


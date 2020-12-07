import * as Util from './Utility';
import * as Mat from "./Matrix";
import { Dictionary } from './Collections';

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
        let distAcc = 0;
        this.clusters.forEach((c, ind) => {
            for (let i = 0; i < c.length; i++) {
                let diff = Mat.Sub(c[i], this.means[ind]);
                distAcc += Mat.Norm(diff);
            }
        });
        this.meanDist = distAcc / nElems;
    }
}

export enum Initializer {
    random,
    KMeansPlusPlus
}


function kMeansPlusPlusInit(nClusters: number, data: Mat.Matrix[]): Mat.Matrix[] {
    let selected = new Dictionary<boolean>();
    let firstIndex = Math.floor(Math.random() * (data.length - 1));
    selected.Set(firstIndex, true);
    let centres: Mat.Matrix[] = [data[firstIndex]];

    while (centres.length < nClusters) {
        //Probability proportional to square of distance from closest centre
        let prob = Util.Fill<number>(data.length, 0);

        for (let i = 0; i < data.length; i++) {
            let minDist = Number.MAX_VALUE;
            for (let c = 0; c < centres.length; c++) {
                let diff = Mat.Sub(data[i], centres[c]);
                let dist = Mat.NormSquare(diff);
                if (dist < minDist) {
                    minDist = dist;
                }
            }
            prob[i] = minDist;
        }

        let cumProb = Util.Fill<number>(data.length, 0);
        let acc = 0;

        for (let i = 0; i < prob.length; i++) {
            acc += prob[i];
            cumProb[i] = acc;
        }
        
        let max = cumProb[cumProb.length - 1];
        let selectedIndex = 0; 
        do{
            let rand = Math.random() * max; 
            //TODO: could potentially use a binary search here
            for(let i = 0; i < cumProb.length; i++){
                if(cumProb[i] >= rand){
                    selectedIndex = i;
                    break;
                }
            }
        }while(selected.ContainsKey(selectedIndex));
        selected.Set(selectedIndex, true);
        centres.push(data[selectedIndex]);
    }
    return centres;
}

//Expects column vectors as inputs
export function Fit(
    data: Mat.Matrix[], nClusters: number,
    nIter: number = 100, init: Initializer = Initializer.random): KMeansResult {

    //if (!Mat.IsColumnVector(data[0])) throw new Error('KMeans: data needs to be an array of column vectors');

    let [nRows, nCols] = Mat.Dimensions(data[0]);
    //Init;
    let selected = {};
    let means = [];

    if (init == Initializer.random) {
        means = Util.UniqueRandom(nClusters, data.length - 1).map(i => data[i]);
    } else {
        //KMeans++
        means = kMeansPlusPlusInit(nClusters, data);
    }

    for (let iter = 0; iter < nIter; iter++) {
        //Assignment
        let clusters = GroupToNearestMean(data, means);

        //Recomputation of means
        means = clusters.map(c => {
            let acc = Mat.CreateMatrix(nRows, nCols);
            for (let i = 0; i < c.length; i++) {
                Mat.AddInPlace(acc, c[i]);
            }
            return Mat.Scale(1 / c.length, acc);
        })
    }

    let updatedClusters = GroupToNearestMean(data, means);
    return new KMeansResult(updatedClusters, means);
}

function GroupToNearestMean(data: Mat.Matrix[], means: Mat.Matrix[]): Mat.Matrix[][] {
    let nClusters = means.length;
    let clusters: Mat.Matrix[][] = Util.FillObj(nClusters, () => []);

    for (let d = 0; d < data.length; d++) {
        let [maxDist, clusterInd] = [Number.MAX_VALUE, -1]
        for (let m = 0; m < nClusters; m++) {
            let diff = Mat.Sub(data[d], means[m]);
            let dist = Mat.NormSquare(diff);
            if (dist < maxDist) {
                maxDist = dist;
                clusterInd = m;
            }
        }
        clusters[clusterInd].push(data[d]);
    }
    return clusters;
}
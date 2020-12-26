import * as Util from "./Utility";
import * as Mat from "./Matrix";
import * as KM from "./KMeans";
import * as Conv from "./ConvergenceChecker";

//TODO: write selectable intializer for GMM

export class GMMCluster{
    readonly dim: number;
    readonly pi: number; //weight;
    readonly mean: Mat.Matrix;
    readonly covariance: Mat.Matrix;
    readonly covarianceDet: number;
    readonly covarianceInv: Mat.Matrix;

    private coeff:number;

    constructor(_pi:number, _mean:Mat.Matrix, _covariance:Mat.Matrix){
        this.pi = _pi;
        this.mean = _mean;
        this.covariance = _covariance;    
        this.covarianceDet = Mat.Determinant(_covariance);
        this.covarianceInv = Mat.Inverse(_covariance);
        this.dim = Math.max(...Mat.Dimensions(_mean));

        let coeffDenominator = Math.sqrt(Math.pow( 2 * Math.PI, this.dim) * this.covarianceDet); 
        this.coeff = this.pi * (1 / coeffDenominator);
    }

    //Multivariate normal * weight of the gaussian
    Likelihood(observation: Mat.Matrix): number {
        let diff = Mat.Sub(observation, this.mean);
        let diff_Transposed = Mat.Transpose(diff);
        let exponentMat = Mat.Mul(Mat.Mul(diff_Transposed, this.covarianceInv), diff);
        let exponent = -0.5 * exponentMat[0][0];
        let result = this.coeff * Math.exp(exponent);
        return result;
    }
}

export enum Initializer{
    random,
    KMeansPlusPlus
}

export class GMMResult{
    likelihoods:number[];

    constructor(likelihoods:number[]){
        this.likelihoods = likelihoods;
    }

    TotalLikelihood():number{
        return Util.Sum(this.likelihoods);
    } 

    //Expresses all likelihoods as a fraction of the highest likelihood
    Normalized():number[]{
        let max = Util.Max(this.likelihoods);
        return this.likelihoods.map(l => l / max);
    }
}

export class GMM {
    clusters: GMMCluster[];

    //TODO: remove parameters for constructor (Fit can calculate all of the relevant params)
    constructor() {

    }

    static PreclusteredDataToGMM(clusteredData:Mat.Matrix[][]): GMM{
        let gmm = new GMM();
        let totalPoints = Util.Sum(clusteredData.map(c => c.length));
        gmm.clusters = clusteredData.map(c => GMM.Points2GMMCluster(c, totalPoints));
        return gmm;
    }

    //Helper function for calculating initial GMMs
    private static Points2GMMCluster(data: Mat.Matrix[], dataPointsInGMMSet:number):GMMCluster{
        let nData = data.length;
        let weight = nData / dataPointsInGMMSet;
        let params = Mat.MeanAndCovariance(data);
        return new GMMCluster(weight, params.mean, params.covariance);
    }

    private RandomInit(data:Mat.Matrix[], nClusters:number):GMMCluster[]{
        let nDim = Mat.Rows(data[0]);
        let selectedIndices = Util.UniqueRandom(nClusters, data.length - 1);
        let equalWeightage = 1 / nClusters;
        return selectedIndices.map( i => {
           return new GMMCluster(equalWeightage, data[i], Mat.Identity(nDim));
        });
    }

    //data: column vectors of each observation
    private EM(data:Mat.Matrix[], initialClusters:GMMCluster[]) : GMMCluster[]{
        let nDataPoints = data.length;
        let nDims = Mat.Rows(data[0]);
        let nClusters = initialClusters.length;

        //Rows: stores the probabilities of the nth cluster
        //Columns: probabilities of x-th observation for the n-th cluster
        let prob = Mat.CreateMatrix(nClusters, nDataPoints);
        let probSum = Util.Fill<number>(data.length, 0);
        
        //http://www.cse.iitm.ac.in/~vplab/courses/DVP/PDF/gmm.pdf
        
        for(let c = 0; c < nClusters; c++){
            let currentCluster = initialClusters[c];
            for(let d = 0; d < nDataPoints; d++){
                let p = currentCluster.Likelihood(data[d]);
                prob[c][d] = p;
                probSum[d] += p;
            }
        }

        let resp = Mat.CreateMatrix(nClusters, nDataPoints);
        let clusterResp = Util.Fill<number>(nClusters, 0);
        for(let c = 0; c < nClusters; c++){
            for(let d = 0; d < nDataPoints; d++){
                let r = prob[c][d] / probSum[d];
                resp[c][d] = r;
                clusterResp[c] += r;
            }
        }

        //Recluster
        //Means
        let clusterSum = 
            Util
            .FillObj<Mat.Matrix>(nClusters, () => Mat.CreateMatrix(nDims, 1));

        for(let c = 0; c < nClusters; c++){
            for(let d = 0; d < nDataPoints; d++){
                let contribution = Mat.Scale(resp[c][d], data[d]);
                Mat.AddInPlace(clusterSum[c], contribution);
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

        for(let c = 0; c < nClusters; c++){
            for(let d = 0; d < nDataPoints; d++){
                let diff = Mat.Sub(data[d], means[c]);
                let diffTransposed = Mat.Transpose(diff);
                let contribution = Mat.Scale(resp[c][d], Mat.Mul(diff, diffTransposed));
                Mat.AddInPlace(covAcc[c], contribution);
            }
        }

        let covariances =
            covAcc.map((cov, ind) => Mat.Scale(1 / clusterResp[ind], cov));

        //Return new GMM cluster hyperparameters
        return means.map((_,cIndex) => {
            return new GMMCluster(weights[cIndex], means[cIndex], covariances[cIndex]); 
        });
    }

    Fit(rawData:Mat.Matrix[], nClusters:number, init:Initializer = Initializer.KMeansPlusPlus, MAX_ITER:number = 20, MIN_PERCENT_CHANGE:number = 1):void{
        if(!Mat.IsVector(rawData[0])){
            throw new Error(`GMM.Fit: Error, data points need to be vectors (ideally column vectors)`);
        }

        //Will be converted to column vectors if necessary
        let data = rawData;
        
        if(Mat.IsRowVector(rawData[0])){
            data = rawData.map(m => Mat.Transpose(m));
        }

        //Init Clusters
        let newClusters: GMMCluster[];
        switch(init){
            case Initializer.random:{
                newClusters = this.RandomInit(data, nClusters); 
                break;
            }
            case Initializer.KMeansPlusPlus:{
                let kMeansResult = KM.Fit(data, nClusters, 20, 1, KM.Initializer.KMeansPlusPlus);
                newClusters = kMeansResult.clusters.map(c => GMM.Points2GMMCluster(c, data.length)); 
                break;
            }
        }

        //EM-Iteration
        let conv = new Conv.ConvergenceChecker(MIN_PERCENT_CHANGE, MAX_ITER);
        let logProb:number;
        do{
            newClusters = this.EM(data, newClusters);  
            logProb = GMM.LogLikelihood(data, newClusters); 
            console.log(`Iteration:${conv.getCurrentIter()}, logProb:${logProb}`);
        }while(!conv.hasConverged(logProb));

        this.clusters = newClusters;
    }

    Predict(rawData:Mat.Matrix):GMMResult{
        let data = Mat.IsColumnVector(rawData)? rawData : Mat.Transpose(rawData);
        let predictions = new Array(this.clusters.length);
        for(let i = 0; i < predictions.length; i++){
            predictions[i] = this.clusters[i].Likelihood(data);
        }
        return new GMMResult(predictions);
    }

    //data: column vectors of each observation
    static LogLikelihood(data:Mat.Matrix[], gmm :GMMCluster[]) : number{
        let logProb = 0;
        for(let d = 0; d < data.length; d++){
            let acc = 0;
            for(let c = 0; c < gmm.length; c++){
                acc += gmm[c].Likelihood(data[d]);
            }
            logProb += Math.log(acc);
        }
        return logProb;
    }
}

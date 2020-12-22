//TODO: test out BK's min cut algorithm
//Implement factory pattern to allow for the selection of different solvers here.

import * as GMM from "./GMM";
import * as Dinic from "./DinicFlowSolver";
import * as BK from "./BKGraph";
import * as FlowBase from "./FlowNetworkSolver";
import * as Mat from "./Matrix";
import * as Util from "./Utility";


export enum Trimap{
    Background = 0,
    Foreground = 1,
    Unknown = 2
}

export class GrabCut{
    private height:number;
    private width:number;
    private img:Mat.Matrix[][]; //Matrices -> [R,G,B] Each element ranges from 0-255
    private trimap: Uint8Array;
    private matte: Uint8Array; 

    private fgGMM = new GMM.GMM();
    private bgGMM = new GMM.GMM();
    
    constructor(image:Mat.Matrix[][]){
        this.height = image.length;
        this.width = image[0].length;
        this.img = image;
        let nPixels = this.width * this.height;
        this.matte = new Uint8Array(nPixels);
        this.trimap = new Uint8Array(nPixels);
    }

    SetTrimap(trimap:Trimap[][], width:number, height:number):void{
        for(let r = 0; r < height; r++){
            for(let c = 0; c < width; c++){
                let ind = GrabCut.GetArrayIndex(r, c, width);
                this.trimap[ind] = trimap[r][c];
            }
        }
    }

    //Returns the alpha mask
    BeginCrop(){
        for(let i = 0; i < this.trimap.length; i++){
            this.matte[i] = (this.trimap[i] == Trimap.Background)? Trimap.Background : Trimap.Foreground;
        }

        let [fgPixels, bgPixels] = GrabCut.SegregatePixels(this.img, this.matte, 0,0, this.height, this.width);

        //Initial color GMMs
        const GMM_N_ITER = 5;
        this.fgGMM.Fit(fgPixels, 5, GMM.Initializer.KMeansPlusPlus, GMM_N_ITER);
        this.bgGMM.Fit(bgPixels, 5, GMM.Initializer.KMeansPlusPlus, GMM_N_ITER);

        let MAX_ITER = 3;
        this.RunIterations(MAX_ITER);
    }

    RunIterations(nIter:number){
        //Create network graph (with edges between neighbouring pixels set)
        //Clone this network & populate with source and sink for use in the graphcut.
        let flowNetwork:FlowBase.IFlowNetwork = new BK.BKNetwork();
        let maxFlowSolver:FlowBase.IMaxFlowSolver = BK.BKMaxflow;

        let [networkBase, maxCapacity] = GrabCut.GeneratePixel2PixelGraph(this.img, flowNetwork);

        for(let iter = 0; iter < nIter; iter++){
            console.log(`iter:${iter}`);
            
            //Update GMMs from previous graphcut result
            //Using the result from the previous graph cut, reclassify pixels as either BG or FG
            let [fgPixels, bgPixels] = GrabCut.SegregatePixels(this.img, this.matte, 0,0, this.height, this.width);
            
            //Within the BG and FG pixel sets, group them to the most similar GMM cluster
            let [fgClusters, bgClusters] = GrabCut.BinPixels(this.fgGMM, this.bgGMM, bgPixels, fgPixels);
            //console.log(fgClusters, bgClusters);
            //Generate new GMMs based on the reclustered data.
            [this.fgGMM, this.bgGMM] = [fgClusters, bgClusters].map(mixture => {
                let nonEmptyClusters = mixture.filter(cluster => cluster.length > 0);
                return GMM.GMM.PreclusteredDataToGMM(nonEmptyClusters);
            });
            console.log(`fg clusters:${this.fgGMM.clusters.length}, bg clusters:${this.bgGMM.clusters.length}`);

            let networkCopy = networkBase.Clone();
            
            let [fullGraph, source, sink] = GrabCut.AddSourceAndSink(networkCopy, maxCapacity, this.fgGMM, this.bgGMM, this.img, this.trimap);
            
            console.log('max flow');
            let flowResult = maxFlowSolver(source, sink, fullGraph);

            console.log('cut');
            let fgPixelIndices = flowResult.GetSourcePartition();
            
            GrabCut.UpdateMatte(this.matte, this.trimap, fgPixelIndices);
        }     
        //Alpha mask is now stored in the matte array.
    }

    //Mask values will be between 0-1
    GetAlphaMask():number[][]{
        let alpha = Mat.CreateMatrix(this.height, this.width);
        for(let i = 0; i < this.matte.length; i++){
            let [r,c] = GrabCut.get2DArrayIndex(i, this.width);
            alpha[r][c] = (this.matte[i] == Trimap.Foreground)? 1.0 : 0.0;
        }
        return alpha;
    }


    private static UpdateMatte(matte:Uint8Array, trimap:Uint8Array, fgPixelIndices:number[]){
        let indexTable = Util.HashItems<number>(fgPixelIndices, n => n);
        for(let i = 0; i < matte.length; i++){
            //Only update pixels that are marked as unknown
            //All other pixels are treated as ground truth (i.e. BG & FG data from the user)
            if(trimap[i] == Trimap.Unknown){
                let isFG = indexTable.ContainsKey(i);
                matte[i] = (isFG)? Trimap.Foreground : Trimap.Background;
            }
        }
    }

    //Returns the FG and BG pixel groups
    private static SegregatePixels(img:Mat.Matrix[][], matte:Uint8Array, top:number, left:number, height:number, width:number): [Mat.Matrix[], Mat.Matrix[]]{
        let fgPixels:Mat.Matrix[] = [];
        let bgPixels:Mat.Matrix[] = [];

        let right = left + width;
        let bot = top + height;
        for(let r = top; r < bot; r++){
            for(let c = left; c < right; c++){
                let matteIndex = GrabCut.GetArrayIndex(r,c, width);
                let currentPixel = img[r][c];
                if(matte[matteIndex] == Trimap.Foreground){
                    fgPixels.push(currentPixel);
                }else{
                    bgPixels.push(currentPixel);
                }
            }
        }
        return [fgPixels, bgPixels];
    }

    //Returns the [FG,BG] pixel clusters
    private static BinPixels(
            fgGMM: GMM.GMM, bgGMM: GMM.GMM, 
            bgPixels:Mat.Matrix[], fgPixels:Mat.Matrix[]): [Mat.Matrix[][], Mat.Matrix[][]]{
        
        let maxIndex = function(arr:number[]):number{
            let max = Number.MIN_VALUE;
            let maxInd = -1;
            for(let i = 0; i < arr.length; i++){
                let current = arr[i];
                if(current > max){
                    maxInd = i;
                    max = current;
                }
            }
            return maxInd;
        }
        
        let fg:Mat.Matrix[][] = Util.FillObj<Mat.Matrix[]>(fgGMM.clusters.length, () => []);
        let bg:Mat.Matrix[][] = Util.FillObj<Mat.Matrix[]>(bgGMM.clusters.length, () => []);
        
        for(let i = 0; i < bgPixels.length ; i++){
            let pixel = bgPixels[i];
            let prob = bgGMM.Predict(pixel).likelihoods;
            let bin = maxIndex(prob);
            bg[bin].push(pixel);
        }

        for(let i = 0; i < fgPixels.length; i++){
            let pixel = fgPixels[i];
            let prob = fgGMM.Predict(pixel).likelihoods;
            let bin = maxIndex(prob);
            fg[bin].push(pixel);
        }

        return [fg,bg];
    }

    //TODO: Clone this network so it can be reused between iterations
    //Pixel to pixel edge capacities do not change
    //Returns the resultant network and the highest edge capacity
    private static GeneratePixel2PixelGraph(img:Mat.Matrix[][], network:FlowBase.IFlowNetwork): [FlowBase.IFlowNetwork, number]{

        let height = img.length;
        let width = img[0].length;
        let nPixels = height * width;

        for(let i = 0; i < nPixels; i++){
            network.CreateNode();
        }

        //Row, Column offsets for all 8 adjacent neighbours
        //let neighbours = [[0,-1],[-1,-1],[-1,0],[-1,1],[0,1],[1,1],[1,0],[1,-1]];
        let neighbours = [[0,-1],[-1,0],[0,1],[1,0]];
        let coeff = neighbours.map(t => 50 / Math.sqrt(t[0] ** 2 + t[1] ** 2));
        
        let maxCap = Number.MIN_VALUE;

        //Set pixel to pixel edge capacities
        for(let r = 0; r < height; r++){
            for(let c = 0; c < width; c++){
                let nodeIndex = GrabCut.GetArrayIndex(r, c, width);

                let adjSet = 
                    neighbours
                    .map(t => [r + t[0], c + t[1]])
                    .filter(t => GrabCut.WithinBounds(t[0], t[1], width, height));
                
                //Calculation of exponential coeff term
                //Norm square of the difference between the current pixel and its neighbours
                let diffSquare:number[] = 
                    adjSet
                    .map(t => Mat.Sub(img[r][c], img[t[0]][t[1]]))
                    .map(d => Mat.NormSquare(d));
                
                let meanDifference = Util.Sum(diffSquare) / diffSquare.length;

                let beta = 1 / (2 * meanDifference);

                //console.log('pixelStart');
                for(let n = 0; n < adjSet.length; n++){
                    let [nR, nC] = adjSet[n];
                    let neighbourIndex = GrabCut.GetArrayIndex(nR, nC, width);
                    let exponent = -beta * diffSquare[n];
                    let capacity = coeff[n] * Math.exp(exponent);
                    network.CreateEdge(nodeIndex, neighbourIndex, capacity);
                    
                    maxCap = (capacity > maxCap)? capacity : maxCap; 
                }
            }
        }

        return [network, maxCap];
    }

    //Source node represents the foreground
    //Returns the new network, with the edges connecting the source (FG) and sink (BG) to the pixels added
    //[network, sourceNodeIndex, sinkNodeIndex]
    private static AddSourceAndSink(
        network:FlowBase.IFlowNetwork, maxCap:number,
        gmmFG: GMM.GMM, gmmBG: GMM.GMM,
        image:Mat.Matrix[][],
        trimap: Uint8Array): [FlowBase.IFlowNetwork, number, number]{

        let [nRows, nCols] = [image.length, image[0].length];

        let srcNode = network.CreateNode();
        let sinkNode = network.CreateNode();

        for(let r = 0; r < nRows; r++){
            for(let c = 0; c < nCols; c++){
                let ind = GrabCut.GetArrayIndex(r,c, nCols);
                switch(trimap[ind]){
                    case Trimap.Foreground:{
                        network.CreateEdge(srcNode, ind, maxCap);
                        
                        break;
                    }
                    case Trimap.Background:{
                        
                        network.CreateEdge(ind, sinkNode, maxCap);
                        break;
                    }
                    case Trimap.Unknown:{
                        let currentPixel = image[r][c];
                        let pFore = GrabCut.GetTLinkWeight(gmmBG, currentPixel);
                        let pBack = GrabCut.GetTLinkWeight(gmmFG, currentPixel);
                        
                        network.CreateEdge(srcNode, ind, pFore);
                        network.CreateEdge(ind, sinkNode, pBack);
                        break;
                    }
                }
            }
        }

        return [network, srcNode, sinkNode];
    }

    private static GetTLinkWeight(gmm:GMM.GMM, pixel:Mat.Matrix):number{
        let gmmResult = gmm.Predict(pixel).TotalLikelihood();
        return -Math.log(gmmResult);
    }

    private static WithinBounds(row:number, col:number, width:number, height:number):boolean{
        return (row >= 0 && row < height) && (col >= 0 && col < width);
    }

    private static GetArrayIndex(row:number, col:number, width:number):number{
        return row * width + col;
    }

    //Indices are returned in the form of [row, col]
    private static get2DArrayIndex(index1D:number, width:number):[number,number]{
        let row = Math.floor(index1D / width);
        let col = index1D % width;
        return [row, col];
    }
}
//TODO: test out BK's min cut algorithm
//Implement factory pattern to allow for the selection of different solvers here.

import * as GMM from "./GMM";
import * as Dinic from "./DinicFlowSolver";
import * as BK from "./BKGraph";
import * as FlowBase from "./FlowNetworkSolver";
import * as Mat from "./Matrix";
import * as Util from "./Utility";
import * as Conv from "./ConvergenceChecker";
import * as V3 from "./V3";

export enum Trimap {
    Background = 0,
    Foreground = 1,
    Unknown = 2
}

export interface Options {
    tolerance: number, //in %
    maxIterations: number,
    cohesionFactor:number,
    nFGClusters:number,
    nBGClusters:number
}

export class GrabCut {
    private height: number;
    private width: number;
    private img: Mat.Matrix[][]; //Matrices -> [R,G,B] Each element ranges from 0-255
    private flattenedImg: Mat.Matrix[]; //Try to migrate to only using flattened arrays
    private trimap: Uint8Array;
    private matte: Uint8Array;

    private fgGMM = new GMM.GMM();
    private bgGMM = new GMM.GMM();

    constructor(image: Mat.Matrix[][]) {
        this.height = image.length;
        this.width = image[0].length;
        this.img = image;
        let nPixels = this.width * this.height;
        this.matte = new Uint8Array(nPixels);
        this.trimap = new Uint8Array(nPixels);

        let flattenedImg = new Array(this.height * this.width);
        for(let r = 0; r < this.height; r++){
            for(let c = 0; c < this.width; c++){
                let linearInd = GrabCut.GetArrayIndex(r,c, this.width);
                flattenedImg[linearInd] = image[r][c];
            }
        }
        this.flattenedImg = flattenedImg;
    }

    SetTrimap(trimap: Trimap[][], width: number, height: number): void {
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                let ind = GrabCut.GetArrayIndex(r, c, width);
                this.trimap[ind] = trimap[r][c];
            }
        }
    }

    //Returns the alpha mask
    BeginCrop(opt: Options) {
        console.log(opt);

        for (let i = 0; i < this.trimap.length; i++) {
            this.matte[i] = (this.trimap[i] == Trimap.Background) ? Trimap.Background : Trimap.Foreground;
        }

        let [fgPixels, bgPixels] = GrabCut.SegregatePixels(this.img, this.matte, 0, 0, this.height, this.width);

        //Initial color GMMs
        const GMM_N_ITER = 5;
        const MIN_PERCENT_CHANGE = 1;
        
        console.time("Grabcut-GM");
        this.fgGMM.Fit(fgPixels, opt.nFGClusters, GMM.Initializer.KMeansPlusPlus, GMM_N_ITER, MIN_PERCENT_CHANGE);
        this.bgGMM.Fit(bgPixels, opt.nBGClusters, GMM.Initializer.KMeansPlusPlus, GMM_N_ITER, MIN_PERCENT_CHANGE);
        console.timeEnd("Grabcut-GM");

        this.RunIterations(opt.maxIterations, opt.tolerance, opt.cohesionFactor);
    }

    RunIterations(nIter: number, tolerancePercent: number, cohesionFactor:number) {
        //Create network graph (with edges between neighbouring pixels set)
        //Clone this network & populate with source and sink for use in the graphcut.
        let flowNetwork: FlowBase.IFlowNetwork = new BK.BKNetwork();//new Dinic.DinicNetwork();;
        let maxFlowSolver: FlowBase.IMaxFlowSolver = BK.BKMaxflow;//Dinic.DinicSolver;//;

        console.time("Grabcut-Pixel Graph");
        let [network, maxCapacity] = GrabCut.GeneratePixel2PixelGraph(this.img, flowNetwork, cohesionFactor);
        let [srcNode, sinkNode] = GrabCut.InitSourceAndSink(network, this.width, this.height);
        console.timeEnd("Grabcut-Pixel Graph");

        let conv = new Conv.ConvergenceChecker(tolerancePercent, nIter);
        let energy: number;

        let labels = Util.Fill<number>(this.width * this.height, 0);

        console.time("Grabcut-Graph Cut");
        do {
            console.log(`iter:${conv.getCurrentIter()}`);

            console.time("Grabcut-Graph init");

            // #region "old gmm reclustering"
            //Update GMMs from previous graphcut result
            //Using the result from the previous graph cut, reclassify pixels as either BG or FG
            /*
            console.time("Grabcut-Graph Seg Pixels");
            let [fgPixels, bgPixels] = GrabCut.SegregatePixels(this.img, this.matte, 0, 0, this.height, this.width);
            console.timeEnd("Grabcut-Graph Seg Pixels");

            //Within the BG and FG pixel sets, group them to the most similar GMM cluster
            console.time("Grabcut-Graph Bin Pixels");
            let [fgClusters, bgClusters] = GrabCut.BinPixels(this.fgGMM, this.bgGMM, bgPixels, fgPixels);
            console.timeEnd("Grabcut-Graph Bin Pixels");

            //Generate new GMMs based on the reclustered data.
            console.time("Grabcut-Graph new GMM");
            [this.fgGMM, this.bgGMM] = [fgClusters, bgClusters].map(mixture => {
                let nonEmptyClusters = mixture.filter(cluster => cluster.length > 0);
                return GMM.GMM.PreclusteredDataToGMM(nonEmptyClusters);
            });
            console.timeEnd("Grabcut-Graph new GMM");
            */
           //#endregion "old gmm reclustering"

            let filterEmptyGroups = (indices:number[], groupSize:number[]) => {
                let validIndices = [];
                let nonEmptyGroups = [];
                for(let i = 0; i < indices.length; i++){
                    if(groupSize[i] > 0){
                        validIndices.push(indices[i]);
                        nonEmptyGroups.push(groupSize[i]);
                    }
                }
                return [validIndices, nonEmptyGroups];
            };

            console.time("Graphcut-Graph GMM-recomputation");
            let [fgInd, fgGroupSizes, bgInd, bgGroupSizes] = GrabCut.LabelPixels(this.matte, this.height, this.width, this.fgGMM, this.bgGMM, this.img, labels);
            let [validFgInd, validFgGroupSizes] = filterEmptyGroups(fgInd, fgGroupSizes);
            let [validBgInd, validBgGroupSizes] = filterEmptyGroups(bgInd, bgGroupSizes);
            [this.fgGMM, this.bgGMM] = GMM.GMM.labelledDataToGMMs(validFgInd, validFgGroupSizes, validBgInd, validBgGroupSizes, labels, this.flattenedImg);
            console.timeEnd("Graphcut-Graph GMM-recomputation");

            console.log(`fg clusters:${this.fgGMM.clusters.length}, bg clusters:${this.bgGMM.clusters.length}`);

            console.time("Grabcut-Graph source sink update");
            GrabCut.UpdateSourceAndSink(network, maxCapacity, this.fgGMM, this.bgGMM, this.img, this.trimap, srcNode, sinkNode);
            console.timeEnd("Grabcut-Graph source sink update");
            console.time("Grabcut-Graph flow reset");
            network.ResetFlow();
            console.timeEnd("Grabcut-Graph flow reset");

            console.timeEnd("Grabcut-Graph init");

            console.time("Grabcut-Graph maxflow");
            console.log('max flow');
            let flowResult = maxFlowSolver(srcNode, sinkNode, network);
            console.timeEnd("Grabcut-Graph maxflow");

            console.time("Grabcut-Graph cut");
            console.log('cut');
            let fgPixelIndices = flowResult.GetSourcePartition();
            GrabCut.UpdateMatte(this.matte, this.trimap, fgPixelIndices);

            energy = flowResult.GetMaxFlow();
            console.timeEnd("Grabcut-Graph cut");
            console.log(`Energy: ${energy}`);
        } while (!conv.hasConverged(energy))
        console.timeEnd("Grabcut-Graph Cut");
        //Done    
        //Alpha mask is now stored in the matte array.
    }

    //Mask values will be between 0-1
    GetAlphaMask(): number[][] {
        let alpha = Mat.CreateMatrix(this.height, this.width);
        for (let i = 0; i < this.matte.length; i++) {
            let [r, c] = GrabCut.get2DArrayIndex(i, this.width);
            alpha[r][c] = (this.matte[i] == Trimap.Foreground) ? 1.0 : 0.0;
        }
        return alpha;
    }


    private static UpdateMatte(matte: Uint8Array, trimap: Uint8Array, fgPixelIndices: number[]) {
        let indexTable = Util.HashItems<number>(fgPixelIndices, n => n);
        for (let i = 0; i < matte.length; i++) {
            //Only update pixels that are marked as unknown
            //All other pixels are treated as ground truth (i.e. BG & FG data from the user)
            if (trimap[i] == Trimap.Unknown) {
                let isFG = indexTable.ContainsKey(i);
                matte[i] = (isFG) ? Trimap.Foreground : Trimap.Background;
            }
        }
    }

    //Returns the FG and BG pixel groups
    private static SegregatePixels(img: Mat.Matrix[][], matte: Uint8Array, top: number, left: number, height: number, width: number): [Mat.Matrix[], Mat.Matrix[]] {
        let fgPixels: Mat.Matrix[] = [];
        let bgPixels: Mat.Matrix[] = [];

        let right = left + width;
        let bot = top + height;
        for (let r = top; r < bot; r++) {
            for (let c = left; c < right; c++) {
                let matteIndex = GrabCut.GetArrayIndex(r, c, width);
                let currentPixel = img[r][c];
                if (matte[matteIndex] == Trimap.Foreground) {
                    fgPixels.push(currentPixel);
                } else {
                    bgPixels.push(currentPixel);
                }
            }
        }
        return [fgPixels, bgPixels];
    }

    //private static SegregatePixels(img: Mat.Matrix[][], matte: Uint8Array, top: number, left: number, height: number, width: number): [Mat.Matrix[], Mat.Matrix[]] {
    //Returns the FG and BG group sizes
    private static LabelPixels(
        matte: Uint8Array, height: number, width: number,
        fgGMM: GMM.GMM, bgGMM: GMM.GMM, img: Mat.Matrix[][],
        labels: number[]): [number[], number[], number[], number[]] {

        let nFGClusters = fgGMM.clusters.length;
        let nBGClusters = bgGMM.clusters.length

        let fgGroupSizes = Util.Fill<number>(nFGClusters, 0);
        let bgGroupSizes = Util.Fill<number>(nBGClusters, 0);

        let maxIndex = function (arr: number[]): number {
            let max = -Number.MAX_SAFE_INTEGER;
            let maxInd = 0;
            for (let i = 0; i < arr.length; i++) {
                let current = arr[i];
                if (current > max) {
                    maxInd = i;
                    max = current;
                }
            }
            return maxInd;
        }

        //Assign labels to each pixel
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                let linearIndex = GrabCut.GetArrayIndex(r, c, width);
                let pixelIsFG = matte[linearIndex] == Trimap.Foreground;
                let currentPixel = img[r][c];

                if (pixelIsFG) {
                    let likelihoods = fgGMM.Predict(currentPixel).likelihoods;
                    let fgGroup = maxIndex(likelihoods);
                    fgGroupSizes[fgGroup]++;
                    labels[linearIndex] = 0 + fgGroup;
                } else { //Bg 
                    let likelihoods = bgGMM.Predict(currentPixel).likelihoods;
                    let bgGroup = maxIndex(likelihoods);
                    bgGroupSizes[bgGroup]++;
                    labels[linearIndex] = nFGClusters + bgGroup;
                }
            }
        }
        let fgIndices = Util.Range(0, nFGClusters);
        let bgIndices = Util.Range(nFGClusters, nFGClusters + nBGClusters);

        return [fgIndices, fgGroupSizes, bgIndices, bgGroupSizes];
    }

    //Returns the [FG,BG] pixel clusters
    private static BinPixels(
        fgGMM: GMM.GMM, bgGMM: GMM.GMM,
        bgPixels: Mat.Matrix[], fgPixels: Mat.Matrix[]): [Mat.Matrix[][], Mat.Matrix[][]] {

        let maxIndex = function (arr: number[]): number {
            let max = Number.MIN_SAFE_INTEGER;
            let maxInd = 0;
            for (let i = 0; i < arr.length; i++) {
                let current = arr[i];
                if (current > max) {
                    maxInd = i;
                    max = current;
                }
            }
            return maxInd;
        }

        let fg: Mat.Matrix[][] = Util.FillObj<Mat.Matrix[]>(fgGMM.clusters.length, () => []);
        let bg: Mat.Matrix[][] = Util.FillObj<Mat.Matrix[]>(bgGMM.clusters.length, () => []);

        for (let i = 0; i < bgPixels.length; i++) {
            let pixel = bgPixels[i];
            let prob = bgGMM.Predict(pixel).likelihoods;
            let bin = maxIndex(prob);
            bg[bin].push(pixel);
        }

        for (let i = 0; i < fgPixels.length; i++) {
            let pixel = fgPixels[i];
            let prob = fgGMM.Predict(pixel).likelihoods;
            let bin = maxIndex(prob);
            fg[bin].push(pixel);
        }

        return [fg, bg];
    }

    //TODO: Clone this network so it can be reused between iterations
    //Pixel to pixel edge capacities do not change
    //Returns the resultant network and the highest edge capacity
    private static GeneratePixel2PixelGraph(img: Mat.Matrix[][], network: FlowBase.IFlowNetwork, cohesionFactor:number): [FlowBase.IFlowNetwork, number] {

        let isV3 = V3.isV3(img[0][0]);

        let height = img.length;
        let width = img[0].length;
        {
            let nPixels = height * width;
            for (let i = 0; i < nPixels; i++) {
                network.CreateNode();
            }
        }

        //Row, Column offsets for all 8 adjacent neighbours
        //let neighbours = [[0,-1],[-1,-1],[-1,0],[-1,1],[0,1],[1,1],[1,0],[1,-1]];
        //neighbours within the 4 cardinal directions gives a better result than 8 surrounding pixels.
        let neighbours = [[0, -1], [-1, 0], [0, 1], [1, 0]];
        let coeff = neighbours.map(t => cohesionFactor / Math.sqrt(t[0] ** 2 + t[1] ** 2));

        let GetNeighbour = (r: number, c: number, neighbourInd: number): [boolean, number, number] => {
            let offset = neighbours[neighbourInd];
            let nR = r + offset[0];
            let nC = c + offset[1];
            let validNeighbour = GrabCut.WithinBounds(nR, nC, width, height);
            return [validNeighbour, nR, nC];
        };

        //Find beta (the mean difference between a pixel and its neighbours)
        let nCount = 0;
        let diffAcc = 0;

        let fnDiffSquare = (isV3)? 
            V3.DiffNormSquare:
            function(v1:Mat.Matrix, v2:Mat.Matrix) {return Mat.NormSquare(Mat.Sub(v1, v2))};

        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                let currentPixel = img[r][c];

                for (let i = 0; i < neighbours.length; i++) {
                    let [validNeighbour, nR, nC] = GetNeighbour(r, c, i);
                    if (!validNeighbour) continue;

                    let neighbouringPixel = img[nR][nC];
                    let diffSquare = fnDiffSquare(currentPixel, neighbouringPixel);
                    diffAcc += diffSquare;
                    nCount++;
                }
            }
        }

        let beta = 0.5 / (diffAcc / nCount);
        let maxCap = -Number.MAX_SAFE_INTEGER;

        //Set pixel to pixel edge capacities
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {

                let nodeIndex = GrabCut.GetArrayIndex(r, c, width);

                for (let i = 0; i < neighbours.length; i++) {
                    let [validNeighbour, nR, nC] = GetNeighbour(r, c, i);
                    if (!validNeighbour) continue;

                    let neighbourIndex = GrabCut.GetArrayIndex(nR, nC, width);
                    let diffSquare = fnDiffSquare(img[r][c], img[nR][nC]);
                    let exponent = -beta * diffSquare;
                    let capacity = coeff[i] * Math.exp(exponent);

                    //Debugging purposes only
                    if (isNaN(capacity)) {
                        console.log({
                            coeff: coeff,
                            beta: beta,
                            exponent: exponent,
                            capacity: capacity
                        });
                    }

                    network.CreateEdge(nodeIndex, neighbourIndex, capacity);
                    maxCap = (capacity > maxCap) ? capacity : maxCap;
                }
            }
        }

        console.log(`Pixel to pixel maximum capacity:${maxCap}`);
        return [network, maxCap];
    }


    //Creates edges from the source nodes to the pixels &
    //edges from the pixel node to the sink node

    //Returns the [sourceNodeIndex, sinkNodeIndex]
    private static InitSourceAndSink(network: FlowBase.IFlowNetwork, width: number, height: number): [number, number] {
        let srcInd = network.CreateNode();
        let sinkInd = network.CreateNode();

        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                //Src to pixel
                let pixelNodeInd = GrabCut.GetArrayIndex(r, c, width);
                network.CreateEdge(srcInd, pixelNodeInd, 0);
            }
        }

        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                //Pixel to src
                let pixelNodeInd = GrabCut.GetArrayIndex(r, c, width);
                network.CreateEdge(pixelNodeInd, sinkInd, 0);
            }
        }
        return [srcInd, sinkInd];
    }

    //Source node represents the foreground
    //Returns the new network, with the edges connecting the source (FG) and sink (BG) to the pixels added
    //[network, sourceNodeIndex, sinkNodeIndex]
    private static UpdateSourceAndSink(
        network: FlowBase.IFlowNetwork, maxCap: number,
        gmmFG: GMM.GMM, gmmBG: GMM.GMM,
        image: Mat.Matrix[][],
        trimap: Uint8Array,
        srcNode: number, sinkNode: number): void {

        let [nRows, nCols] = [image.length, image[0].length];

        for (let r = 0; r < nRows; r++) {
            for (let c = 0; c < nCols; c++) {
                let ind = GrabCut.GetArrayIndex(r, c, nCols);
                switch (trimap[ind]) {
                    case Trimap.Foreground: {
                        network.UpdateEdge(srcNode, ind, maxCap);
                        network.UpdateEdge(ind, sinkNode, 0);
                        break;
                    }
                    case Trimap.Background: {
                        network.UpdateEdge(srcNode, ind, 0);
                        network.UpdateEdge(ind, sinkNode, maxCap);
                        break;
                    }
                    case Trimap.Unknown: {
                        let currentPixel = image[r][c];
                        let pFore = GrabCut.GetTLinkWeight(gmmBG, currentPixel);
                        let pBack = GrabCut.GetTLinkWeight(gmmFG, currentPixel);

                        network.UpdateEdge(srcNode, ind, pFore);
                        network.UpdateEdge(ind, sinkNode, pBack);
                        break;
                    }
                }
            }
        }
    }

    private static GetTLinkWeight(gmm: GMM.GMM, pixel: Mat.Matrix): number {
        let gmmResult = gmm.Predict(pixel).TotalLikelihood();
        let res = -Math.log(gmmResult);
        if (isNaN(res)) {
            console.log({
                gmm: gmm,
                res: res,
                pixel: pixel,
                gmmResult: gmmResult
            });
            //Temporary bandaid
            return 0;
        }
        return res;
    }

    private static WithinBounds(row: number, col: number, width: number, height: number): boolean {
        return (row >= 0 && row < height) && (col >= 0 && col < width);
    }

    private static GetArrayIndex(row: number, col: number, width: number): number {
        return row * width + col;
    }

    //Indices are returned in the form of [row, col]
    private static get2DArrayIndex(index1D: number, width: number): [number, number] {
        let row = Math.floor(index1D / width);
        let col = index1D % width;
        return [row, col];
    }
}
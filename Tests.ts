import * as graph from "./DinicFlowSolver";
import * as gmm from "./GMM";
import * as Mat from "./Matrix";
import * as cGen from "./ClusterGenerator";
import * as GMM from "./GMM";
import * as KMeans from "./KMeans";
import * as BK from "./BKGraph";
import * as DS from "./Collections";
import * as Util from "./Utility";
import * as FlowBase from "./FlowNetworkSolver"
import {fCase2, MFCase, test3, t50, t16} from "./MaxFlowTestCase"

function mFlowComparison(){
    let dNetwork = new graph.DinicNetwork();
    let BKNetwork = new BK.BKNetwork();

    let src = 0;
    let dest = 101;

    for(let i = 0; i < 102; i++){
        dNetwork.CreateNode();
        BKNetwork.CreateNode();
    }

    let arcs = 
        MFCase
        .split("\n")
        .filter(l => l.length > 0)
        .map(line => line.trim())
        .map(line => line.split(/\s+/))
        .filter(t => t[0] == "a")
        .map(t => [t[1], t[2], t[3]].map(n => parseInt(n)));

    arcs.forEach(t => {
        let src = t[0] - 1;
        let dest = t[1] - 1;
        let cap = t[2];
        dNetwork.CreateEdge(src, dest, cap);
        BKNetwork.CreateEdge(src, dest, cap);
    });
    
    let dMaxFlow = graph.DinicSolver(src, dest, dNetwork).GetMaxFlow();
    let bkMaxFlow = BK.BKMaxflow(src, dest, BKNetwork).GetMaxFlow();

    console.log('------------------Max Flow comparison--------------');
    console.log(`Dinic:${dMaxFlow}\nBK:${bkMaxFlow}`);
}

mFlowComparison();


function mFlowComparison2(){
    let dNetwork = new graph.DinicNetwork();
    let BKNetwork = new BK.BKNetwork();

    let arcs = 
        t16
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.split(/\s+/))
        .map(t => t.map(n => parseInt(n)));

    for(let i = 0; i < arcs.length; i++){
        dNetwork.CreateNode();
        BKNetwork.CreateNode();
    }

    let src = 0;
    let dest = arcs.length - 1;

    arcs.forEach((t,ind) => {
        for(let i = 0; i < t.length; i++){
            let src = ind;
            let dest = i;
            let cap = t[i];
            if(src == dest || cap == 0) continue;

            dNetwork.CreateEdge(src, dest, cap);
            BKNetwork.CreateEdge(src, dest, cap);
        }
    });
    
    let dMaxFlow = graph.DinicSolver(src, dest, dNetwork).GetMaxFlow();
    let bkMaxFlow = BK.BKMaxflow(src, dest, BKNetwork).GetMaxFlow();

    console.log('------------------Max Flow comparison 2--------------');
    console.log(`Dinic:${dMaxFlow}\nBK:${bkMaxFlow}`);
    console.log(`expected: 2789`);
}

mFlowComparison2();

/*
function QueueTest(){
    let queue = new DS.CircularBufferQueue<number>(1);
    for(let i = 0; i < 100; i++){
        queue.Enqueue(i);
    }

    for(let i = 0; i < 50; i++){
        queue.Dequeue();
    }

    let arr:number[] = [];

    while(queue.Count() > 0){
        arr.push(queue.Dequeue());
    }

    console.log(arr);
}
//QueueTest();

function QueueBenchmark(){
    const N_ITEMS = 1000;
    const N_ITER = 1000000;

    console.time("Circular Queue");
    let cQueue = new DS.CircularBufferQueue<number>();

    for(let i = 0; i < N_ITER; i++){
        for(let j = 0; j < N_ITEMS; j++){
            cQueue.Enqueue(j);
        }
        while(cQueue.Count() > 0) cQueue.Dequeue();
    }
    console.timeEnd("Circular Queue");

    console.time("Stack Queue");
    let sQueue = new DS.DoubleStackQueue<number>();
    for(let i = 0; i < N_ITER; i++){
        for(let j = 0; j < N_ITEMS; j++){
            sQueue.Enqueue(j);
        }
        while(sQueue.Count() > 0) sQueue.Dequeue();
    }

    console.timeEnd("Stack Queue");
}

//QueueBenchmark();

function labelledQueueTest(){
    let lQueue = new DS.LabelledCircularQueue<number>();

    for(let i = 0; i < 100; i++){
        lQueue.Enqueue(i);
    }
    for(let i = 1; i < 100; i += 2){
        lQueue.Remove(i);
    }

    let arr:number[] = [];
    while(lQueue.Count() > 0){
        arr.push(lQueue.Dequeue());
    }
    console.log(arr);
}

//labelledQueueTest();

function BKTest(){
    console.log("BKTest()");
    let network: BK.BKNetwork = new BK.BKNetwork();

    for (let i = 0; i <= 5; i++) {
        network.CreateNode();
    }

    let src = 0;
    let sink = 5;
    //example from https://www.geeksforgeeks.org/minimum-cut-in-a-directed-graph/
    network.CreateEdge(src, 1, 16);
    network.CreateEdge(src, 2, 13);

    network.CreateEdge(1, 2, 10);
    network.CreateEdge(1, 3, 12);

    network.CreateEdge(2, 1, 4);
    network.CreateEdge(2, 4, 14);

    network.CreateEdge(3, 2, 9);
    network.CreateEdge(3, sink, 20);

    network.CreateEdge(4, 3, 7);
    network.CreateEdge(4, sink, 4);

    console.log("BK max flow start");
    let flowResult = BK.BKMaxflow(src, sink, network);
    console.log("BK max flow end");

    console.log(flowResult.GetSourcePartition());
    console.log("Expected: [0,1,2,4]");
}

BKTest();

function BKTest2(){
    console.log("BKTest 2");
    let network: BK.BKNetwork = new BK.BKNetwork();

    for (let i = 0; i <= 7; i++) {
        network.CreateNode();
    }

    let src = 0;
    let sink = 6;
    //example from https://en.wikipedia.org/wiki/Edmonds%E2%80%93Karp_algorithm
    network.CreateEdge(src, 1, 3);
    network.CreateEdge(src, 3, 3);

    network.CreateEdge(1, 2, 4);

    network.CreateEdge(2, 0, 3);
    network.CreateEdge(2, 3, 1);
    network.CreateEdge(2, 4, 2);

    network.CreateEdge(3, 5, 6);
    network.CreateEdge(3, 4, 2);

    network.CreateEdge(4, 1, 1);
    network.CreateEdge(4, 6, 1);

    network.CreateEdge(5, 6, 9);

    console.log("BK max flow start");
    let flowResult = BK.BKMaxflow(src, sink, network);
    console.log("BK max flow end");

    console.log(flowResult.GetSourcePartition());
    console.log("Expected: [0,1,2,4]");

    let maxFlow = flowResult.GetMaxFlow();
    console.log(`Maxflow-expected:5, actual:${maxFlow}`);
}

BKTest2();



function DinicTest1() {
    let network: graph.Network = new graph.Network();

    for (let i = 0; i <= 5; i++) {
        network.CreateNode();
    }
    let src = 0;
    let sink = 5;
    //example from https://www.geeksforgeeks.org/minimum-cut-in-a-directed-graph/
    network.CreateEdge(src, 1, 16);
    network.CreateEdge(src, 2, 13);

    network.CreateEdge(1, 2, 10);
    network.CreateEdge(1, 3, 12);

    network.CreateEdge(2, 1, 4);
    network.CreateEdge(2, 4, 14);

    network.CreateEdge(3, 2, 9);
    network.CreateEdge(3, sink, 20);

    network.CreateEdge(4, 3, 7);
    network.CreateEdge(4, sink, 4);

    let levelGraph = graph.DinicMaxFlow(network, src, sink);

    let minResult = graph.MinCut(network, src, sink, levelGraph);

    console.log(minResult.edgeIndices.map(ind => network.edgeList[ind].capacity));
    console.log("Expected: [12, 7, 4]");
    console.log(minResult.nodeList);
    console.log("Expected: [0,1,2,4]");

}

DinicTest1();

function MatrixDetTest(): void {
    console.log('Matrix test cases----------');

    let test2D = [[3, 2], [5, 2]]; //det = -4
    let mat2D = Mat.FromArray(test2D);
    let det2D = Mat.Determinant(mat2D);
    console.log(`2by2 determinant: ${det2D}, expected: -4`);

    let test3by3 = [[6, 1, 1], [4, -2, 5], [2, 8, 7]]; //det = -306
    let mat3b3 = Mat.FromArray(test3by3);
    let det3 = Mat.Determinant(mat3b3);
    console.log(`3by3 determinant: ${det3}, expected: -306`);

    let test4by4 = [[4, 3, 2, 2], [0, 1, -3, 3], [0, -1, 3, 3], [0, 3, 1, 1]]; //det = -240
    let mat4b4 = Mat.FromArray(test4by4);
    let det4 = Mat.Determinant(mat4b4);
    console.log(`4by4 determinant: ${det4}, expected: -240`);

    let testSub = Mat.FromArray([[1, 1], [1, 1]]);
    let sub = Mat.Sub(testSub, testSub);
    console.log(`Matrix subtraction:\n${Mat.Print(sub)}, expected: all zeros`);

    let add = Mat.Add(testSub, testSub);
    console.log(`Matrix Addition:\n${Mat.Print(add)}, expected: all 2s`);

    let subScalar = Mat.AddScalar(-1, testSub);
    console.log(`Scalar Addition:\n${Mat.Print(subScalar)}, expected: all 0s`);

    let transpose = Mat.FromArray([[1, 2], [3, 4], [5, 6]]);
    let transposed = Mat.Transpose(transpose);
    console.log(`Transposition:\n${Mat.Print(transposed)}, expected: [[1,3,5],[2,4,6]`)
    let repeatedTranspose = Mat.Transpose(transposed);
    console.log(`Repeated Tranposition:\n${Mat.Print(repeatedTranspose)}, expected: [[1,2],[3,4],[5,6]`);

    let scaleTest = Mat.Scale(100, Mat.FromArray([[1, 1], [2, 2]]));
    console.log(`Scale Test:\n${Mat.Print(scaleTest)}, expected: [[100,100],[200,200]]`);

    let seed = Mat.FromArray([[3, 0, 2], [2, 0, -2], [0, 1, 1]]);
    let cofactors = Mat.Cofactors(seed);
    let inv = Mat.Inverse(seed);
    console.log(`Cofactors:\n${Mat.Print(cofactors)}, expected[[2,-2,2],[2,3,-3],[0,10,0]`);
    console.log(`Inv:\n${Mat.Print(inv)}, expected[[0.2,0.2,0],[-0.2,0.3,1],[0.2,-0.3,0]`);
}

MatrixDetTest();

function MatrixDetInv() {
    let test1 = [[-8, -11, -8], [10, -4, 3], [-4, 13, 14]];
    let det1 = Mat.Determinant(test1);
    console.log(`Det test: ${det1}, expected 1520`);

    let test2 = [[0, -3, -2], [1, -4, -2], [-3, 4, 1]];
    let inv2 = Mat.Inverse(test2);
    let expected2 = [[4, -5, -2], [5, -6, -2], [-8, 9, 3]];
    console.log(`Inv test:\n${Mat.Print(inv2)}\nexpected\n${Mat.Print(expected2)}`)

    let mul3 = Mat.Mul(test1, test2);
    let expected3 = [[13, 36, 30], [-13, -2, -9], [-29, 16, -4]];
    console.log(`Mul test:\n${Mat.Print(mul3)}\nexpected\n${Mat.Print(expected3)}`);

    let test4 = [[2, 6, -3], [5, -1, -13], [1, -14, 8]];
    let transposed4 = Mat.Transpose(test4);
    let expected4 = [[2, 5, 1], [6, -1, -14], [-3, -13, 8]];
    console.log(`Tranpose test:\n${Mat.Print(transposed4)}\nexpected\n${Mat.Print(expected4)}`);
}

MatrixDetInv();

function ClusterGeneratorTest() {
    let clusterSize = 10000;
    let cluster1 = cGen.UniformClusters([[-5, -5]], [[2, 2]], clusterSize);
    let cluster2 = cGen.UniformClusters([[5, 5]], [[2, 2]], clusterSize);
    let cluster3 = cGen.UniformClusters([[0, 15]], [[2, 2]], clusterSize);
    let cluster4 = cGen.UniformClusters([[-10, 0]], [[2, 2]], clusterSize);

    let joined = cluster1.concat(cluster2).concat(cluster3).concat(cluster4);

    let result = KMeans.Fit(joined, 4, 5, KMeans.Initializer.KMeansPlusPlus);

    console.log("KMeans");
    console.log(result.means);

    console.log('GMM');
    let gmmSet = cluster1.concat(cluster2);
    let gmm = new GMM.GMM();
    gmm.Fit(joined, 4);

    
    joined.forEach(m => {
        console.log(`Point:${m}: predictions:${gmm.Predict(m)}`);
    });
    

    gmm.clusters.forEach(g => {
        console.log(g.mean);
    });
}

ClusterGeneratorTest();

*/



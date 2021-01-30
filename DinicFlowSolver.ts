import * as Util from './Utility'
import * as Dict from "./Collections/Dictionary"
import * as Q from "./Collections/Queue"
import * as FlowBase from "./FlowNetworkSolver"

export class Edge{
    source:number;
    sink:number;
    reverse:number;
    id:number;
    capacity:number;
    flow:number;
    constructor(_src:number, _sink:number, _cap:number, _id:number){
        this.sink = _sink;
        this.source = _src;
        this.capacity = _cap;
        this.flow = 0;
        this.id = _id;
    }
}

export class GraphNode{
    edges:Edge[];
    id:number;

    constructor(_id:number){
        this.id = _id;
        this.edges = [];
    }
}

export class DinicNetwork implements FlowBase.IFlowNetwork{
    nodeList: GraphNode[]; 
    edgeList: Edge[]; //Every second edge will be a reverse edge.
    
    private edgeMap: Dict.IHashtable<number>[] = [];
    
    constructor(){
        this.nodeList = []; 
        this.edgeList = [];
    }

    CreateNode():number{
        let count = this.nodeList.length;
        this.nodeList.push(new GraphNode(count));
        this.edgeMap.push(new Dict.ObjectDict<number>());
        return count;
    }

    CreateEdge(source:number, sink:number, capacity:number):number{
        let count = this.edgeList.length;
        let newEdge = new Edge(source, sink, capacity, count);
        let residualEdge = new Edge(sink, source, 0, count + 1);
        newEdge.reverse = residualEdge.id;
        residualEdge.reverse = newEdge.id;
        
        this.nodeList[source].edges.push(newEdge);
        this.nodeList[sink].edges.push(residualEdge);
        this.edgeList.push(newEdge);
        this.edgeList.push(residualEdge);

        //Residual edge will not be stored in the edgeMap
        this.edgeMap[source].Set(sink, count);

        //Return the index of the forward(non-residual) edge
        return count;
    }

    ResetFlow():void{
        let edges = this.edgeList;
        for(let i = 0; i < edges.length; i++){
            edges[i].flow = 0;
        }
    }

    UpdateEdge(srcNodeInd:number, destNodeInd:number, newCap:number){
        let targetEdgeInd = this.edgeMap[srcNodeInd].Get(destNodeInd);
        this.edgeList[targetEdgeInd].capacity = newCap;
        //Reverse (residual) edge need not be updated (capacity stays 0)
    }

    Clone():DinicNetwork{
        
        let clone = new DinicNetwork();

        //Init nodes
        for(let i = 0; i < this.nodeList.length; i++) clone.CreateNode();

        //Clone edges
        let originalEdges = this.edgeList;
        for(let i = 0; i < originalEdges.length; i += 2){
            let oEdge = originalEdges[i];
            let oRes = originalEdges[i + 1];
            let cEdgeInd = clone.CreateEdge(oEdge.source, oEdge.sink, oEdge.capacity);
            let cEdge:Edge = clone.edgeList[cEdgeInd];
            let cRes:Edge = clone.edgeList[cEdgeInd + 1];
            //Copy flow values over
            cEdge.flow = oEdge.flow;
            cRes.flow = oRes.flow;
        }

        return clone;
        /*
        let srcEdges = this.edgeList;
        let srcNodes = this.nodeList;
        
        //Copy edge list
        let newEdges = srcEdges.map(s => {
            let copy = new Edge(s.source, s.sink, s.capacity, s.id);
            copy.reverse = s.reverse;
            copy.flow = s.flow;
            return copy;
        }); 

        let edgeDict = Util.HashItems(newEdges, e => e.id);
        let newNodes = srcNodes.map(n => new GraphNode(n.id)); //Will need to deep copy the edgeList array to reference it to its own seperate copy of edges
        for(let i = 0; i < newNodes.length; i++){
            //Populate the new edgeList with references to its own edges
            srcNodes[i].edges.forEach(e => {
                let edgeID = e.id;
                newNodes[i].edges.push(edgeDict.Get(edgeID));
            });
        }
        let n = new DinicNetwork();
        n.edgeList = newEdges;
        n.nodeList = newNodes;
        return n;
        */
    }
}

//Debug counters
let lGraph = 0;
let fPath = 0;
let nAugment = 0;

function DinicLevelGraph(sinkID:number, sourceID:number, nodes:GraphNode[], visitedArr:Dict.VisitedArray, levelGraph:number[]) : boolean{
    lGraph++;

    Util.Memset<number>(levelGraph, -1);
    let [visited, visitedToken] = visitedArr.UpdateToken();

    let nodeFrontier = new Q.CircularBufferQueue<number>(); 
    let depthFrontier = new Q.CircularBufferQueue<number>();
    nodeFrontier.Enqueue(sourceID);
    depthFrontier.Enqueue(0);
    visited[sourceID] = visitedToken;

    while(nodeFrontier.Count() > 0){
        let nodeID = nodeFrontier.Dequeue();
        let depth = depthFrontier.Dequeue();

        levelGraph[nodeID] = depth; //Assign depth;

        let node = nodes[nodeID];
        let edges = node.edges;

        let nextDepth = depth + 1;

        for(let i = 0; i < edges.length; i++){
            let e:Edge = edges[i];
            
            if( (e.capacity - e.flow) > 0 && 
                (visited[e.sink] != visitedToken)){

                visited[e.sink] = visitedToken;
                nodeFrontier.Enqueue(e.sink);
                depthFrontier.Enqueue(nextDepth);
            }
        }
    }

    let pathFound:boolean = levelGraph[sinkID] != -1;
    return pathFound;
}

function DinicFindPath(sinkID:number, sourceID:number, nodes:GraphNode[], visitedArr:Dict.VisitedArray, levelGraph:number[], path:number[], activeEdge:number[]):boolean{
    fPath++;

    let [visited, visitedToken] = visitedArr.UpdateToken();
    path[sinkID] = -1;
    path[sourceID] = -1;

    let stack:number[] = [];
    stack.push(sourceID);
    visited[sourceID] = visitedToken;

    while(stack.length > 0){
        let nodeID = stack[stack.length - 1]; //peek

        if(nodeID == sinkID) break; //Found a path, terminate

        let edgeList = nodes[nodeID].edges;
        let nodeFound = false;

        for(let i = activeEdge[nodeID]; i < edgeList.length; i++){
            let e:Edge = edgeList[i];
            if( (levelGraph[nodeID] < levelGraph[e.sink]) && 
                (e.capacity - e.flow > 0) &&
                (visited[e.sink] != visitedToken)){
                
                visited[e.sink] = visitedToken;
                path[e.sink] = e.id;
                stack.push(e.sink);
                nodeFound = true;
                //Only push one node within this level into the stack
                //activeEdges will keep track of which node to search next
                break; 
            }else{
                //Node not traversable
                //Increment to ensure this gets skipped in the future.
                activeEdge[nodeID] += 1;
            }
        }
        //Backtrack
        if(!nodeFound){
            stack.pop();
        }
    }
    //Check if the sink node was traversed
    let augmentingPathFound = (path[sinkID] >= 0); 
    return augmentingPathFound;
}

function DinicAugmentFlow(sinkID:number, sourceID:number, edges:Edge[], path:number[]){
    nAugment++;

    const MAX_INT:number = 9007199254740991;
    //Find minimum flow
    let walk = sinkID; 
    let bottleneck = MAX_INT;
    while(walk != sourceID){
        let edge = edges[path[walk]];
        let remainingCapacity = edge.capacity - edge.flow;
        bottleneck = Math.min(bottleneck, remainingCapacity);
        walk = edge.source;
    }

    //Augment flow
    walk = sinkID;
    while(walk != sourceID){
        let edge = edges[path[walk]];
        let reverse = edges[edge.reverse];
        edge.flow += bottleneck;
        reverse.flow -= bottleneck;
        walk = edge.source;
    }
}

//Returns the level graph of the final iteration to help obtain the minimum cut.
//Values marked -1 are untraversed.
export function DinicMaxFlow(network:DinicNetwork, sourceID:number, sinkID:number): number[]{
    lGraph = 0;
    fPath = 0;
    nAugment = 0;

    let nodes = network.nodeList;
    let edges = network.edgeList;

    let levelGraph:number[] = Util.Fill<number>(nodes.length, 0);
    let visitedArr = new Dict.VisitedArray(nodes.length);
    let path = Util.Fill<number>(nodes.length, -1); //Stores edge used to traverse to the node

    let pathFound = true;

    //Used in the dfs to track which node to search next
    //Instead of simply pumping all possible nodes into the stack
    //Only one from each level will be inserted.
    let activeEdge = Util.Fill<number>(nodes.length, 0);

    while(pathFound){
        //Build level graph
        pathFound = DinicLevelGraph(sinkID, sourceID, nodes, visitedArr, levelGraph);

        if(!pathFound) continue; //Terminate - no more augmenting paths possible

        //Augment flows
        let augmentedFlow = true; 
        //Reset to 0 for the DFS
        Util.Memset(activeEdge, 0);
        while(augmentedFlow){
            augmentedFlow = DinicFindPath(sinkID, sourceID, nodes, visitedArr, levelGraph, path, activeEdge);
            if(!augmentedFlow) continue; //terminate augmenting phase
            //Backtrack & Augment flows
            DinicAugmentFlow(sinkID,sourceID, edges, path);
        }
    }

    console.log(`calls to levelGraph:${lGraph}\ncalls to fPath:${fPath}\ncalls to augment:${nAugment}`);

    return levelGraph;
}

export interface MinCutResult{
    nodeList:number[], //Connected to the source
    edgeIndices:number[]
}

//To be run after solving for Max Flow on a network
//Returns the indexes of the cut edges
export function MinCut(network:DinicNetwork, sourceID:number, sinkID:number, levelGraph:number[]):MinCutResult{
    let minCutIndices:number[] = [];
    let visitedNodeList:number[] = [];

    let nodes = network.nodeList;
    let visited = Util.Fill<boolean>(nodes.length, false);
    let frontier = new Q.CircularBufferQueue<number>();
    frontier.Enqueue(sourceID);
    visited[sourceID] = true;
    while(frontier.Count() > 0){
        let nodeID = frontier.Dequeue();
        visitedNodeList.push(nodeID);
        let currentNode = nodes[nodeID];

        currentNode.edges.forEach(e => {
            let nextNodeID = e.sink;
            if(!visited[nextNodeID]){
                if(levelGraph[nextNodeID] >= 0){
                    //Continue to search through the graph
                    visited[nextNodeID] = true;
                    frontier.Enqueue(nextNodeID);
                }else{
                    //Edge joining a reachable node to an unreachable node, add to the minimum cut set
                    if(e.capacity > 0){ //Omit residual edges
                        minCutIndices.push(e.id);
                    }
                }
            }
        });
    }
    return {nodeList:visitedNodeList, edgeIndices:minCutIndices} as MinCutResult;
}

export let DinicSolver: FlowBase.IMaxFlowSolver;

DinicSolver = function(src: number, sink: number, network: DinicNetwork):FlowBase.IMaxFlowResult{
    let levelGraph = DinicMaxFlow(network, src, sink);
    let minCut = MinCut(network, src, sink, levelGraph);
    
    let sourceOutflux = () => {
        let srcNode = network.nodeList[src];
        return Util.Sum(srcNode.edges.map(e => e.flow));
    }

    let STreeIndices = () => minCut.nodeList;

    return{
        GetMaxFlow: sourceOutflux,
        GetSourcePartition: STreeIndices
    }
}
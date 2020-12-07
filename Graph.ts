import * as Util from './Utility'
import * as DS from './Collections'

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

export class Network{
    nodeList: GraphNode[]; 
    edgeList: Edge[]; //Every second edge will be a reverse edge.
    
    constructor(){
        this.nodeList = [];
        this.edgeList = [];
    }

    CreateNode():number{
        let count = this.nodeList.length;
        this.nodeList.push(new GraphNode(count));
        return count;
    }

    CreateEdge(source:number, sink:number, capacity:number) : number{
        let count = this.edgeList.length;
        let newEdge = new Edge(source, sink, capacity, count);
        let residualEdge = new Edge(sink, source, 0, count + 1);
        newEdge.reverse = residualEdge.id;
        residualEdge.reverse = newEdge.id;
        
        this.nodeList[source].edges.push(newEdge);
        this.nodeList[sink].edges.push(residualEdge);
        this.edgeList.push(newEdge);
        this.edgeList.push(residualEdge);
        return count;
    }

    static Clone(original:Network):Network{
        let srcEdges = original.edgeList;
        let srcNodes = original.nodeList;
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
        let n = new Network();
        n.edgeList = newEdges;
        n.nodeList = newNodes;
        return n;
    }
}

//Debug counters
let lGraph = 0;
let fPath = 0;
let nAugment = 0;

function DinicLevelGraph(sinkID:number, sourceID:number, edges:Edge[], nodes:GraphNode[], visitedArr:DS.VisitedArray, levelGraph:number[]) : boolean{
    lGraph++;

    Util.Memset<number>(levelGraph, -1);
    let [visited, visitedToken] = visitedArr.UpdateToken();

    let nodeFrontier = new DS.Queue<number>(); 
    let depthFrontier = new DS.Queue<number>();
    nodeFrontier.Enqueue(sourceID);
    depthFrontier.Enqueue(0);
    visited[sourceID] = visitedToken;

    while(nodeFrontier.Count() > 0){
        let nodeID = nodeFrontier.Dequeue();
        let depth = depthFrontier.Dequeue();

        levelGraph[nodeID] = depth; //Assign depth;

        let node = nodes[nodeID];
        let edges = node.edges;
        let nEdges = edges.length;

        let nextDepth = depth + 1;

        for(let i = 0; i < nEdges; i++){
            let e:Edge = edges[i];
            
            if( (e.capacity - e.flow) > 0 && 
                (visited[e.sink] != visitedToken)){

                visited[e.sink] = visitedToken;
                nodeFrontier.Enqueue(e.sink);
                depthFrontier.Enqueue(nextDepth);
            }
        };
    }

    let pathFound:boolean = levelGraph[sinkID] != -1;
    return pathFound;
}

function DinicFindPath(sinkID:number, sourceID:number, nodes:GraphNode[], visitedArr:DS.VisitedArray, levelGraph:number[], path:number[], activeEdge:number[]):boolean{
    fPath++;

    let [visited, visitedToken] = visitedArr.UpdateToken();
    path[sinkID] = -1;
    path[sourceID] = -1;

    let stack:number[] = [];
    stack.push(sourceID);

    while(stack.length > 0){
        let nodeID = stack[stack.length - 1];
        //Mark as traversed, so it will be ignored in future searches if the dfs backtracks
        visited[nodeID] = visitedToken; 

        if(nodeID == sinkID) break;     //Found a path, terminate

        let edgeList = nodes[nodeID].edges;
        let nEdges = edgeList.length;    
        let nodeFound = false;

        for(let i = activeEdge[nodeID]; i < nEdges; i++){
            let e:Edge = edgeList[i];
            if( (levelGraph[nodeID] < levelGraph[e.sink]) && 
                (e.capacity - e.flow > 0) &&
                (visited[e.sink] != visitedToken)){

                stack.push(e.sink);
                path[e.sink] = e.id;
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
    let minFlow = MAX_INT;
    while(walk != sourceID){
        let edge = edges[path[walk]];
        let remainingCapacity = edge.capacity - edge.flow;
        minFlow = Math.min(minFlow, remainingCapacity);
        walk = edge.source;
    }

    //Augment flow
    walk = sinkID;
    while(walk != sourceID){
        let edge = edges[path[walk]];
        let reverse = edges[edge.reverse];
        edge.flow += minFlow;
        reverse.flow -= minFlow;
        walk = edge.source;
    }
}

//Returns the level graph of the final iteration to help obtain the minimum cut.
//Values marked -1 are untraversed.
export function DinicMaxFlow(network:Network, sourceID:number, sinkID:number): number[]{
    lGraph = 0;
    fPath = 0;
    nAugment = 0;

    let nodes = network.nodeList;
    let edges = network.edgeList;

    let levelGraph:number[] = Util.Fill<number>(nodes.length, 0);
    let visitedArr = new DS.VisitedArray(nodes.length);
    let path = Util.Fill<number>(nodes.length, -1); //Stores edge used to traverse to the node

    let pathFound = true;

    //Used in the dfs to track which node to search next
    //Instead of simply pumping all possible nodes into the stack
    //Only one from each level will be inserted.
    let activeEdge = Util.Fill<number>(nodes.length, 0);

    while(pathFound){
        //Build level graph
        pathFound = DinicLevelGraph(sinkID, sourceID, edges, nodes, visitedArr, levelGraph);

        if(!pathFound) continue; //Terminate - no more augmenting paths possible

        //Augment flows
        let augmentedFlow = true; 
        //Reset to 0 for the BFS
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
export function MinCut(network:Network, sourceID:number, sinkID:number, levelGraph:number[]):MinCutResult{
    let minCutIndices:number[] = [];
    let visitedNodeList:number[] = [];

    let nodes = network.nodeList;
    let visited = Util.Fill<boolean>(nodes.length, false);
    let frontier = new DS.Queue<number>();
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
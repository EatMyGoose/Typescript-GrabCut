import * as DS from "./Collections";
import * as Util from "./Utility";
import * as FlowBase from "./FlowNetworkSolver";

export enum TreeFlag {
    Free = 0,
    S = 1,
    T = 2
}

class BKEdge {
    from: number;
    to: number;
    flow: number;
    cap: number;
    ind: number;
    constructor(from: number, to: number, capacity: number, index: number) {
        this.cap = capacity;
        this.flow = 0;
        this.to = to;
        this.from = from;
        this.ind = index;
    }
}

//Sparse adjacency matrix
class BKNode {
    edgesOut: BKEdge[] = [];
    edgesIn: BKEdge[] = [];

    constructor() {

    }
}

export class BKNetwork implements FlowBase.IFlowNetwork {
    nodes: BKNode[] = [];
    edges: BKEdge[] = [];
    private edgeList: DS.Dictionary<BKEdge>[] = [];

    constructor() {

    }

    CreateNode(): number {
        let ind = this.nodes.length;
        this.nodes.push(new BKNode());
        this.edgeList.push(new DS.Dictionary<BKEdge>());
        return ind;
    }

    CreateEdge(source: number, dest: number, capacity: number): number{
        if(isNaN(capacity)) throw new Error("capacity cannot be NaN");
        if(!isFinite(capacity)) throw new Error("Infinite capacity");
        
        let edgeInd = this.edges.length;
        let edge = new BKEdge(source, dest, capacity, edgeInd);
        this.edges.push(edge);
        this.nodes[source].edgesOut.push(edge);
        this.nodes[dest].edgesIn.push(edge);

        //Update edgelist
        this.edgeList[source].Set(dest, edge);  
        return edgeInd; 
    }

    //Does update existing flow values. 
    //Call Resetflow after updating edges to prevent over-saturated edges
    UpdateEdge(srcIndex:number, destInd:number, newCap:number):void{
        let targetEdge:BKEdge = this.edgeList[srcIndex].Get(destInd);
        targetEdge.cap = newCap;
    }

    ResetFlow():void{
        let edges = this.edges;
        for(let i = 0; i < edges.length; i++){
            edges[i].flow = 0;
        }
    }

    Clone(): BKNetwork {
        let clone = new BKNetwork();

        //Init nodes
        for(let i = 0; i < this.nodes.length; i++) clone.CreateNode();

        //Clone edges
        let oE = this.edges;
        for(let i = 0; i < oE.length; i++){
            let oEdge = oE[i];
            let cEdgeInd = clone.CreateEdge(oEdge.from, oEdge.to, oEdge.cap);
            //Copy flow values over
            let cEdge = clone.edges[cEdgeInd];
            cEdge.flow = oEdge.flow;
        }

        return clone;
    }
}

const NULL_PARENT = -1;

//Returns null if no path is found
//Returned Edge: from(source) -> to(sink)
//The edge represents the connection between the source and sink trees
function BKGrow(nodes: BKNode[], active: DS.IQueue<number>, flags: Uint8Array, parents: number[], edgeToParent: BKEdge[], activeEdge:number[]): BKEdge | null {

    while (active.Count() > 0) {
        let nInd = active.Peek();
        let group = flags[nInd];
        let n = nodes[nInd];

        if (group == TreeFlag.S) { //Source tree
            let edgesOut = n.edgesOut;
            for (let i = activeEdge[nInd]; i < edgesOut.length; i++) {
                let e = edgesOut[i];
                //Only process unsaturated edges
                if (e.flow >= e.cap) continue;

                let destNodeInd = e.to;

                if (flags[destNodeInd] == TreeFlag.T) {
                    return e; //Found a path;
                } else if (flags[destNodeInd] == TreeFlag.Free) {
                    flags[destNodeInd] = group;
                    parents[destNodeInd] = nInd;
                    edgeToParent[destNodeInd] = e; //Mark the edge used to traverse to the child node
                    active.Enqueue(destNodeInd);
                }
                //To ensure previous edges are not re-traversed
                activeEdge[nInd] = i;
            }
        } else { //Sink Tree
            let edgesIn = n.edgesIn;
            for (let i = activeEdge[nInd]; i < edgesIn.length; i++) {
                let e = edgesIn[i];

                //Only process unsaturated edges
                if (e.flow >= e.cap) continue;

                let destNodeInd = e.from;
                if (flags[destNodeInd] == TreeFlag.S) {
                    return e; //Found a path;
                } else if (flags[destNodeInd] == TreeFlag.Free) {
                    flags[destNodeInd] = group;
                    parents[destNodeInd] = nInd;
                    edgeToParent[destNodeInd] = e; //Mark the edge used to traverse to the parent node
                    active.Enqueue(destNodeInd);
                }
                //To ensure previous edges are not re-traversed
                activeEdge[nInd] = i;
            }
        }

        //Processed all neighbours, remove from active set
        active.Dequeue();
        //Reset active edge
        activeEdge[nInd] = 0; 
    }
    return null;
}

//Parents only used for debugging purposes
function BKBottleneck(src: number, sink: number, connector: BKEdge, edgeToParent: BKEdge[]): number {
    let bottleneck = connector.cap - connector.flow;

    //Traverse up S tree
    {
        let walkS = connector.from;
        while (walkS != src) {
            //if (parents[walkS] == NULL_PARENT) throw Error("Null parent in augmenting path");
            let edge = edgeToParent[walkS];
            bottleneck  = Math.min(bottleneck, edge.cap - edge.flow);
            /*
            let newMin = Math.min(bottleneck, edge.cap - edge.flow);
            
            if(isNaN(newMin)){
                console.log(bottleneck);
                console.log(edge);
                throw new Error(`Bottleneck NaN, edge:${edge}`);
            }
            bottleneck = newMin
            */
            walkS = edge.from;
        }
    }


    //Traverse Down T tree
    {
        let walkT = connector.to;
        while (walkT != sink) {
            //if (parents[walkT] == NULL_PARENT) throw Error("Null parent in augmenting path");          
            let edge = edgeToParent[walkT];
            bottleneck = Math.min(bottleneck, edge.cap - edge.flow);
            /*
            let newMin  = Math.min(bottleneck, edge.cap - edge.flow);
            
            if(isNaN(newMin)){
                console.log(bottleneck);
                console.log(edge);
                throw new Error(`Bottleneck NaN, edge:${edge}`);
            }
            bottleneck = newMin;
            */
            walkT = edge.to;
        }
    }

    return bottleneck;
}

function BKAugment(bottleneck: number, src: number, sink: number, connector: BKEdge, edgeToParent: BKEdge[], orphanSet: number[], parents: number[]): void {
    connector.flow += bottleneck;

    //Traverse up S tree
    {
        let walkS = connector.from;
        while (walkS != src) {
            let edge = edgeToParent[walkS];

            edge.flow += bottleneck;
            //Add saturated parent to orphan set 
            if (edge.cap <= edge.flow) {
                //if (flags[walkS] != TreeFlag.S) throw new Error("wrong cut");
                parents[walkS] = NULL_PARENT;    //To signal that this is an orphan in the adoption phase
                orphanSet.push(walkS);
            }
            walkS = edge.from;
        }
    }

    //Traverse Down T tree
    {
        let walkT = connector.to;
        while (walkT != sink) {
            let edge = edgeToParent[walkT];
            edge.flow += bottleneck;
            //Add saturated parent to orphan set 
            if (edge.cap <= edge.flow) {
                //if (flags[walkT] != TreeFlag.T) throw new Error("wrong cut");
                parents[walkT] = NULL_PARENT;    //To signal that this is an orphan in the adoption phase
                orphanSet.push(walkT);
            }
            walkT = edge.to;
        }
    }
}

//These 2 functions (LinkedToSource & LinkedToSink) are to be used only after calling BKAugment, 
//in order to set the parents to NULL_PARENT as signals that the nodes are orphans
function LinkedToSource(nodeInd: number, srcInd: number, parents: number[], edgeToParent: BKEdge[]): boolean {
    let walkS = nodeInd;
    while (walkS != srcInd) {
        if (parents[walkS] == NULL_PARENT) return false; //Orphan detected in path
        let edge = edgeToParent[walkS];
        // if (flags[walkS] != TreeFlag.S) throw new Error("Wrong tree");
        walkS = edge.from;
    }
    return true;
}

function LinkedToSink(nodeInd: number, sinkInd: number, parents: number[], edgeToParent: BKEdge[]): boolean {
    let walkT = nodeInd;
    while (walkT != sinkInd) {
        if (parents[walkT] == NULL_PARENT) return false; //Orphan detected in path
        let edge = edgeToParent[walkT];
        // if (flags[walkT] != TreeFlag.T) throw new Error("Wrong tree");
        walkT = edge.to;
    }
    return true;
}

function BKAdopt(nodes: BKNode[], orphanSet: number[], flags: Uint8Array, parents: number[], edgeToParent: BKEdge[], activeSet: DS.LabelledCircularQueue<number>, src: number, sink: number) {
    while (orphanSet.length > 0) {
        let ind = orphanSet.pop();
        let orphanNode = nodes[ind];
        let group = flags[ind];
        //if (group == TreeFlag.Free) throw new Error("Free node");
        let isSourceTree = group == TreeFlag.S;

        //Find parents (non-saturated connecting edge + within same tree)
        //Note: in the augmenting phase, orphans had their parents set to -1

        let parentFound = false;
        {
            let edges = (isSourceTree) ? orphanNode.edgesIn : orphanNode.edgesOut;
            for (let i = 0; i < edges.length; i++) {
                let e = edges[i];
                let parentInd = (isSourceTree) ? e.from : e.to;
                let unsaturated = e.cap > e.flow;
                let sameGroup = flags[parentInd] == group;

                if (unsaturated && sameGroup) {
                    let linkedToSource = (isSourceTree) ?
                        LinkedToSource(e.from, src, parents, edgeToParent) :
                        LinkedToSink(e.to, sink, parents, edgeToParent);
                    if (linkedToSource) {
                        //Valid parent found
                        parentFound = true;
                        parents[ind] = parentInd;
                        edgeToParent[ind] = e;
                        break;
                    }
                }
            }
        }

        if (parentFound) continue; //skip to processing the next orphan

        //Update the children and parents of the orphan node
        //Source -> parent: upstream node , child: downstream ndoe
        //Sink -> parent:downstream node, child: upstream node

        {
            if (isSourceTree) {
                //Scan parents to look for candidates 
                //to add to the Active Set
                let edgesIn = orphanNode.edgesIn;
                for (let i = 0; i < edgesIn.length; i++) {
                    let e = edgesIn[i];
                    if (e.flow < e.cap && flags[e.from] == group) {
                        if (!activeSet.Contains(e.from)) {
                            activeSet.Enqueue(e.from);
                        }
                    }
                }

                //Scan children & add to orphan set
                let edgesOut = orphanNode.edgesOut;
                for (let i = 0; i < edgesOut.length; i++) {
                    let e = edgesOut[i];
                    if (flags[e.to] == group && parents[e.to] == ind) {
                        orphanSet.push(e.to);
                        parents[e.to] = NULL_PARENT;
                    }
                }

            } else {
                //Sink tree
                //Scan parents (those closer to the sink node) 
                //to add to the active set

                let edgesOut = orphanNode.edgesOut;
                for(let i = 0; i < edgesOut.length; i++){
                    let e = edgesOut[i];
                    if(e.flow < e.cap && flags[e.to] == group){
                        if (!activeSet.Contains(e.to)) {
                            activeSet.Enqueue(e.to);
                        }
                    }
                }

                //Find children & add them to the orphan set

                let edgesIn = orphanNode.edgesIn;
                for(let i = 0; i < edgesIn.length; i++){
                    let e = edgesIn[i];
                    if(flags[e.from] == group && parents[e.from] == ind){
                        orphanSet.push(e.from);
                        parents[e.from] = NULL_PARENT;
                    }
                }
            }
        }

        //Set the current orphan to a passive node
        flags[ind] = TreeFlag.Free;
        if (activeSet.Contains(ind)) {
            activeSet.Remove(ind);
        }
    }
}



//https://discovery.ucl.ac.uk/id/eprint/13383/1/13383.pdf

//Returns the min-cut result (S-T tree groups)

export let BKMaxflow: FlowBase.IMaxFlowSolver;

BKMaxflow = function (src: number, sink: number, network: BKNetwork): FlowBase.IMaxFlowResult {

    let nodes = network.nodes;

    let active = new DS.LabelledCircularQueue<number>();
    let activeEdge = Util.Fill<number>(nodes.length, 0);
    //let flags: Uint8Array = Util.Fill<TreeFlag>(nodes.length, TreeFlag.Free);
    let flags: Uint8Array = new Uint8Array(nodes.length); //default to 0, i.e. TreeFlag.Free
    let parents: number[] = Util.Fill<number>(nodes.length, NULL_PARENT);
    //path: stores the edge that leads to the parent, used for finding the augmenting path
    let edgeToParent: BKEdge[] = Util.Fill<BKEdge>(nodes.length, null);
    let orphans: number[] = [];


    active.Enqueue(src);
    active.Enqueue(sink);
    flags[src] = TreeFlag.S;
    flags[sink] = TreeFlag.T;

    while (true) {
        //Grow
        //console.log("Grow");
        let connector = BKGrow(nodes, active, flags, parents, edgeToParent, activeEdge);

        if (connector == null) break; //No augmenting path found, max flow found

        //Augment
        //console.log("Bottleneck");
        let min = BKBottleneck(src, sink, connector, edgeToParent);
        //console.log("Augment");
        BKAugment(min, src, sink, connector, edgeToParent, orphans, parents);

        //Adoption phase
        //console.log("adoption");
        BKAdopt(nodes, orphans, flags, parents, edgeToParent, active, src, sink);
    }

    let sourceOutflux = () => Util.Sum(nodes[src].edgesOut.map(e => e.flow));
    let STreeIndices = () =>
        Array.from(flags)
            .map((f, ind) => [f, ind])
            .filter(t => t[0] == TreeFlag.S)
            .map(t => t[1]);

    return {
        GetMaxFlow: sourceOutflux,
        GetSourcePartition: STreeIndices
    }
}


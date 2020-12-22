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

    constructor() {

    }

    CreateNode(): number {
        let ind = this.nodes.length;
        this.nodes.push(new BKNode());
        return ind;
    }

    CreateEdge(source: number, dest: number, capacity: number): void {
        let edge = new BKEdge(source, dest, capacity, this.edges.length);
        this.edges.push(edge);
        this.nodes[source].edgesOut.push(edge);
        this.nodes[dest].edgesIn.push(edge);
    }

    Clone(): BKNetwork {
        let edgeCopy = new Array(this.edges.length);
        for (let i = 0; i < edgeCopy.length; i++) {
            let original = this.edges[i];
            let clonedEdge = new BKEdge(original.from, original.to, original.cap, i);
            clonedEdge.flow = original.flow;
            edgeCopy[i] = clonedEdge;
        }

        let nodeCopy = new Array(this.nodes.length);
        for (let i = 0; i < nodeCopy.length; i++) {
            let originalNode = this.nodes[i];
            let clonedNode = new BKNode();
            clonedNode.edgesOut = originalNode.edgesOut.map(e => edgeCopy[e.ind]);
            clonedNode.edgesIn = originalNode.edgesIn.map(e => edgeCopy[e.ind]);
            nodeCopy[i] = clonedNode;
        }

        let clonedNetwork = new BKNetwork();
        clonedNetwork.nodes = nodeCopy;
        clonedNetwork.edges = edgeCopy;
        return clonedNetwork;
    }
}

const NULL_PARENT = -1;

//Returns null if no path is found
//Returned Edge: from(source) -> to(sink)
//The edge represents the connection between the source and sink trees
function BKGrow(nodes: BKNode[], active: DS.IQueue<number>, flags: TreeFlag[], parents: number[], edgeToParent: BKEdge[]): BKEdge | null {

    while (active.Count() > 0) {
        let nInd = active.Peek();
        let group = flags[nInd];
        let otherTree = (group == TreeFlag.S) ? TreeFlag.T : TreeFlag.S;
        let n = nodes[nInd];

        if (group == TreeFlag.S) { //Source tree
            let nonSaturatedEdges =
                n.edgesOut.filter(e => e.cap - e.flow > 0);

            for (let i = 0; i < nonSaturatedEdges.length; i++) {
                let e = nonSaturatedEdges[i];
                let destNodeInd = e.to;

                if (flags[destNodeInd] == TreeFlag.T) {
                    return e; //Found a path;
                } else if (flags[destNodeInd] == TreeFlag.Free) {
                    flags[destNodeInd] = group;
                    parents[destNodeInd] = nInd;
                    edgeToParent[destNodeInd] = e; //Mark the edge used to traverse to the child node
                    active.Enqueue(destNodeInd);
                }
            }
        } else { //Sink Tree
            let nonSaturatedEdges =
                n.edgesIn.filter(e => e.cap - e.flow > 0);

            for (let i = 0; i < nonSaturatedEdges.length; i++) {
                let e = nonSaturatedEdges[i];
                let destNodeInd = e.from;
                if (flags[destNodeInd] == TreeFlag.S) {
                    return e; //Found a path;
                } else if (flags[destNodeInd] == TreeFlag.Free) {
                    flags[destNodeInd] = group;
                    parents[destNodeInd] = nInd;
                    edgeToParent[destNodeInd] = e; //Mark the edge used to traverse to the parent node
                    active.Enqueue(destNodeInd);
                }
            }
        }

        //Processed all neighbours, remove from active set
        active.Dequeue();
    }
    return null;
}

//Parents only used for debugging purposes
function BKBottleneck(src: number, sink: number, connector: BKEdge, edgeToParent: BKEdge[], parents: number[]): number {
    let bottleneck = connector.cap - connector.flow;

    /*
    let SList = [];
    let SEdges = [];
    let TList = [];
    let TEgdes = [];*/
    //Traverse up S tree
    {
        let walkS = connector.from;
        while (walkS != src) {
            let edge = edgeToParent[walkS];
            if (parents[walkS] == NULL_PARENT) {
                throw Error("Null parent in augmenting path");
            }
            /*
            SList.push(walkS);
            SEdges.push(edge);
            */
            bottleneck = Math.min(bottleneck, edge.cap - edge.flow);
            walkS = edge.from;
        }
    }


    //Traverse Down T tree
    {
        let walkT = connector.to;
        while (walkT != sink) {
            let edge = edgeToParent[walkT];
            if (parents[walkT] == NULL_PARENT) {
                throw Error("Null parent in augmenting path");
            }
            /*
            TList.push(walkT);
            TEgdes.push(edge);
            */
            bottleneck = Math.min(bottleneck, edge.cap - edge.flow);
            walkT = edge.to;
        }
    }

    /*
    console.log(`bottleneck:${bottleneck}`);
    
    console.log(SList);
    console.log(SEdges);
    console.log(TList);
    console.log(TEgdes);
    if(bottleneck == 0){
        throw Error("");
    }*/
    //console.log(bottleneck);
    return bottleneck;
}

function BKAugment(bottleneck: number, src: number, sink: number, connector: BKEdge, edgeToParent: BKEdge[], orphanSet: number[], parents: number[], flags: TreeFlag[]): void {

    connector.flow += bottleneck;

    //Traverse up S tree
    {
        let walkS = connector.from;
        while (walkS != src) {
            let edge = edgeToParent[walkS];

            edge.flow += bottleneck;
            //Add saturated parent to orphan set 
            if (edge.cap <= edge.flow) {
                parents[walkS] = NULL_PARENT;    //To signal that this is an orphan in the adoption phase
                orphanSet.push(walkS);
                if (flags[walkS] != TreeFlag.S) {
                    throw new Error("wrong cut");
                }
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
                parents[walkT] = NULL_PARENT;    //To signal that this is an orphan in the adoption phase
                orphanSet.push(walkT);

                if (flags[walkT] != TreeFlag.T) {
                    throw new Error("wrong cut");
                }
            }
            walkT = edge.to;
        }
    }
}

//These 2 functions (LinkedToSource & LinkedToSink) are to be used only after calling BKAugment, 
//in order to set the parents to NULL_PARENT as signals that the nodes are orphans
function LinkedToSource(ind: number, srcInd: number, sinkInd: number, parents: number[], edgeToParent: BKEdge[], flags: TreeFlag[]): boolean {
    let walkS = ind;
    while (walkS != srcInd) {
        /*
        console.log("SOURCE");
        console.log(`S:${srcInd}, T:${sinkInd}`);
        console.log(flags[walkS]);
        console.log(walkS);*/
        if (parents[walkS] == NULL_PARENT) return false; //Orphan detected in path

        let edge = edgeToParent[walkS];
        //console.log(edge);

        if (flags[walkS] != TreeFlag.S) {
            throw new Error("Wrong tree");
        }

        walkS = edge.from;
    }
    return true;
}

function LinkedToSink(ind: number, srcInd: number, sinkInd: number, parents: number[], edgeToParent: BKEdge[], flags: TreeFlag[]): boolean {
    let walkT = ind;
    while (walkT != sinkInd) {
        /*
        console.log("SINK");
        console.log(`S:${srcInd}, T:${sinkInd}`);
        console.log(flags[walkT]);
        console.log(walkT);*/
        if (parents[walkT] == NULL_PARENT) return false; //Orphan detected in path

        let edge = edgeToParent[walkT];
        //console.log(edge);

        if (flags[walkT] != TreeFlag.T) {
            throw new Error("Wrong tree")
        }

        walkT = edge.to;
    }
    return true;
}

function BKAdopt(nodes: BKNode[], orphanSet: number[], flags: TreeFlag[], parents: number[], edgeToParent: BKEdge[], activeSet: DS.LabelledCircularQueue<number>, src: number, sink: number) {
    while (orphanSet.length > 0) {
        //console.log(orphanSet.length);

        let ind = orphanSet.pop();
        let orphanNode = nodes[ind];
        let group = flags[ind];
        let isSourceTree = group == TreeFlag.S;
        if (group == TreeFlag.Free) {
            throw new Error("Free node");
        }

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
                        LinkedToSource(e.from, src, sink, parents, edgeToParent, flags) :
                        LinkedToSink(e.to, src, sink, parents, edgeToParent, flags);
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

        //console.log(`parent not found for ${ind}`);
        {
            if (isSourceTree) {
                //Add to active set
                //parents
                orphanNode.edgesIn
                    .filter(e => e.flow < e.cap && flags[e.from] == group)
                    .forEach(e => {
                        if (!activeSet.Contains(e.from)) {
                            activeSet.Enqueue(e.from)
                        }
                    });

                //Add to orphan set
                //Update children
                orphanNode.edgesOut
                    .filter(e => flags[e.to] == group && parents[e.to] == ind)
                    .forEach(e => {
                        orphanSet.push(e.to);
                        parents[e.to] = NULL_PARENT;
                    });

            } else {
                //Sink tree
                //Add to active set
                //parents

                //console.log(orphanNode.edgesOut);
                orphanNode.edgesOut
                    .filter(e => e.flow < e.cap && flags[e.to] == group)
                    .forEach(e => {
                        if (!activeSet.Contains(e.to)) {
                            activeSet.Enqueue(e.to);
                        }
                    });

                //Update orphan set
                /*
                console.log(orphanNode.edgesIn);
                console.log(orphanNode.edgesIn.map(e => parents[e.from]));
                console.log(group);
                console.log(orphanNode.edgesIn.map(e => flags[e.from]));*/

                orphanNode.edgesIn
                    .filter(e => flags[e.from] == group && parents[e.from] == ind)
                    .forEach(e => {
                        orphanSet.push(e.from);
                        parents[e.from] = NULL_PARENT;
                    });
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
    let flags: TreeFlag[] = Util.Fill<TreeFlag>(nodes.length, TreeFlag.Free);
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
        let connector = BKGrow(nodes, active, flags, parents, edgeToParent);

        if (connector == null) break; //No augmenting path found, max flow found

        //Augment
        //console.log("Bottleneck");
        let min = BKBottleneck(src, sink, connector, edgeToParent, parents);
        //console.log("Augment");
        BKAugment(min, src, sink, connector, edgeToParent, orphans, parents, flags);

        //Adoption phase
        //console.log("adoption");
        BKAdopt(nodes, orphans, flags, parents, edgeToParent, active, src, sink);
    }

    let sourceOutflux = () => Util.Sum(nodes[src].edgesOut.map(e => e.flow));
    let STreeIndices = () =>
        flags
            .map((f, ind) => [f, ind])
            .filter(t => t[0] == TreeFlag.S)
            .map(t => t[1]);

    return {
        GetMaxFlow: sourceOutflux,
        GetSourcePartition: STreeIndices
    }
}


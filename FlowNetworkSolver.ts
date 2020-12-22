export interface IFlowNetwork{
    CreateNode():number;
    CreateEdge(soureNode:number, destNode:number, capacity:number):void;
    Clone():IFlowNetwork;
}

export interface IMaxFlowResult{
    GetMaxFlow():number;
    GetSourcePartition():number[];
}

export interface IMaxFlowSolver{
    (sourceIndex:number, sinkIndex:number, network:IFlowNetwork):IMaxFlowResult;
}
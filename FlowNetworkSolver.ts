export interface IFlowNetwork{
    CreateNode():number;
    CreateEdge(sourceNode:number, destNode:number, capacity:number):number;
    Clone():IFlowNetwork;
    ResetFlow():void;
    UpdateEdge(sourceNode:number, destNode:number, newCapacity:number):void;
}

export interface IMaxFlowResult{
    GetMaxFlow():number;
    GetSourcePartition():number[];
}

export interface IMaxFlowSolver{
    (sourceIndex:number, sinkIndex:number, network:IFlowNetwork):IMaxFlowResult;
}
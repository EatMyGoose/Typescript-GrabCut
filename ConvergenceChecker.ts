export class ConvergenceChecker{
    private maxIter:number = 0;
    private iterCount:number = 0;

    private lastObjFnValue:number = null;
    private minChange:number = 1; //Minimum fractional change of the objective function's value between iterations required to continue iterating

    constructor(minPercentChange:number, maxIter:number){
        this.maxIter = maxIter;
        this.minChange = minPercentChange / 100;
    }    

    hasConverged(objFnValue:number, iter:number = -1):boolean{
        this.iterCount = (iter < 0)? this.iterCount + 1 : iter;

        if(this.iterCount >= this.maxIter) return true; 

        if(this.lastObjFnValue == null){
            //First iteration, store value & do nothing
            this.lastObjFnValue = objFnValue;
            return false;

        }else{
            let diff = Math.abs(objFnValue - this.lastObjFnValue);
            let denominator = Math.abs(objFnValue);

            //Update previous value;
            this.lastObjFnValue = objFnValue;

            //Fractional change is infinite
            if(denominator == 0) return false; 

            let fractionalChange = (diff / denominator);

            return fractionalChange < this.minChange; //Signal exit if the current change in value is too small
        }   
    }

    getCurrentIter(){
        return this.iterCount;
    }
}
import * as Util from "./Utility";

export class Queue<T>{
    //Double stack queue
    private incoming:T[];
    private outgoing:T[];
    private size:number;

    constructor(){
        this.incoming = [];
        this.outgoing = [];
        this.size = 0;
    }

    Enqueue(value:T):void{
        this.size += 1;
        this.incoming.push(value);
    }

    Dequeue():T{
        if(this.outgoing.length == 0){
            while(this.incoming.length > 0){
                let last = this.incoming.pop();
                this.outgoing.push(last);
            }
        }

        this.size -= 1;
        return this.outgoing.pop();
    }

    Count():number{
        return this.size;
    }
}

export type dictKey = number|string;

interface hashtable<TValue>{
    [key:number]: TValue;
    [key:string]: TValue;
}
//Implemented to get typescript to stop complaining about noImplicitAny from the Object based hashtable

export class Dictionary<TValue>{
    private hashtable:hashtable<TValue> = {};
    constructor(){

    }

    ContainsKey(key:dictKey):boolean{
        return this.hashtable.hasOwnProperty(key);
    }

    Get(key:dictKey): TValue{
        return this.hashtable[key];
    }

    Set(key:dictKey, value: TValue):void{
        this.hashtable[key] = value;
    }
}

export class VisitedArray{
    private visited:number[];
    private token:number;
    constructor(size:number){
        this.visited = Util.Fill<number>(size, -1);
        this.token = 0;
    }

    UpdateToken():[number[], number]{
        const threshold = 2147483647;
        if(this.token >= threshold){
            //Loop back to prevent overflow issues
            this.token = 1;
            //Clear old values
            Util.Memset(this.visited, 0);
        }
        this.token += 1;
        return [this.visited, this.token];
    }
}
import * as Util from "../Utility";

interface hashtable<TValue> {
    [key: string]: TValue;
    [key: number]: TValue;
}

type dictKey = string | number;

//Only supports integer keys
export interface IHashtable<TValue> {
    ContainsKey(key: dictKey): boolean;
    Remove(key: dictKey): void;
    Get(key: dictKey): TValue;
    Set(key: dictKey, value: TValue): void;
}


export class ObjectDict<TValue> implements IHashtable<TValue>{
    private hashtable: hashtable<TValue> = {};
    constructor() {

    }

    ContainsKey(key: dictKey): boolean {
        return this.hashtable.hasOwnProperty(key);
    }

    Remove(key: dictKey) {
        delete this.hashtable[key];
    }

    Get(key: dictKey): TValue {
        return this.hashtable[key];
    }

    Set(key: dictKey, value: TValue): void {
        this.hashtable[key] = value;
    }

    ToList():[string,TValue][]{
        return Object.keys(this.hashtable).map(s => [s, this.hashtable[s]]);  
    }
}

//Cheaper alternative to a dictionary for marking visits
//Returns an array of integers, which can be set to the "visited token"
//Calling UpdateToken returns the same array but increments the "visited token"
export class VisitedArray {
    private visited: number[];
    private token: number;
    constructor(size: number) {
        this.visited = Util.Fill<number>(size, -1);
        this.token = 0;
    }

    UpdateToken(): [number[], number] {
        const threshold = 2147483647;
        if (this.token >= threshold) {
            //Loop back to prevent overflow issues
            this.token = 1;
            //Clear old values
            Util.Memset(this.visited, 0);
        }
        this.token += 1;
        return [this.visited, this.token];
    }
}
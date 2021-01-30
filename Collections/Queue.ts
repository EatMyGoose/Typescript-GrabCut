import * as Dict from "./Dictionary";
import * as Util from "../Utility";

export interface IQueue<T> {
    Enqueue(value: T): void;
    Peek(): T;
    Dequeue(): T;
    Count(): number;
}

export class DoubleStackQueue<T> implements IQueue<T>{
    //Double stack queue
    protected incoming: T[];
    protected outgoing: T[];
    protected size: number;

    constructor() {
        this.incoming = [];
        this.outgoing = [];
        this.size = 0;
    }

    private Shift() {
        while (this.incoming.length > 0) {
            let last = this.incoming.pop();
            this.outgoing.push(last);
        }
    }

    Enqueue(value: T): void {
        this.size += 1;
        this.incoming.push(value);
    }

    Peek(): T {
        if (this.outgoing.length == 0) {
            this.Shift();
        }
        return this.outgoing[this.outgoing.length - 1];
    }

    Dequeue(): T {
        if (this.outgoing.length == 0) {
            this.Shift();
        }

        this.size -= 1;
        return this.outgoing.pop();
    }

    Count(): number {
        return this.size;
    }
}

export class CircularBufferQueue<T> implements IQueue<T>{
    protected buffer: T[];
    protected head: number = 0; //Dequeue location
    protected tail: number = 0; //Insertion location
    protected count: number = 0;

    constructor(initialSize: number = 32) {
        this.buffer = new Array(initialSize);
    }

    private Resize(currentSize:number, newSize:number):void {
        let resized = new Array(newSize);
        for (let i = 0; i < currentSize; i++) {
            let ind = (this.tail + i) % currentSize;
            resized[i] = this.buffer[ind];
        }
        this.buffer = resized;
        this.tail = 0;
        this.head = this.count;
    }

    Enqueue(value: T): void {
        this.count++;
        this.buffer[this.head] = value;
        this.head = (this.head + 1);
        if (this.head >= this.buffer.length) {
            this.head = 0;
        }

        if (this.head == this.tail) {
            //Max capacity reached
            //Expand buffer
            this.Resize(this.buffer.length, this.buffer.length * 2);
        }
    }

    Peek(): T {
        return this.buffer[this.tail];
    }
    Dequeue(): T {
        this.count -= 1;
        let element = this.buffer[this.tail];

        this.tail++;
        if (this.tail >= this.buffer.length) {
            this.tail = 0;
        }

        return element;
    }

    Count(): number {
        return this.count;
    }

}

export class LabelledCircularQueue extends CircularBufferQueue<number>{
    protected skip: boolean[];
    protected indices: Dict.IHashtable<number>;

    constructor(initialSize: number = 32) {
        super(initialSize);
        this.skip = Util.Fill<boolean>(initialSize, false);
        this.indices = new Dict.ObjectDict<number>();
    }

    private ResizeBuffers(currentSize:number, newSize:number):void {
        let resizedSkip = new Array(newSize);
        let resizedBuffer = new Array(newSize);
        let newDict = new Dict.ObjectDict<number>();
        let destInd = 0;
        for(let i = 0; i < currentSize; i++){
            let ind = (this.tail + i) % currentSize;

            if(this.skip[ind]) continue;

            let currentValue = this.buffer[ind];
            resizedBuffer[destInd] = currentValue;
            resizedSkip[destInd] = false;
            newDict.Set(currentValue, destInd);
            destInd++;
        }

        this.indices = newDict;
        this.buffer = resizedBuffer;
        this.skip = resizedSkip;
        this.tail = 0;
        this.head = this.count;
    }

    Contains(value:number):boolean{
        return this.indices.ContainsKey(value);
    }
    
    Remove(value:number){
        this.count--;
        let ind = this.indices.Get(value);
        if(!this.indices.ContainsKey(value)){
            throw new Error(`queue does not contain element ${value}`);
        }
        this.indices.Remove(value);
        this.skip[ind] = true;
    }

    Enqueue(value: number) {
        this.count++;

        this.skip[this.head] = false;
        this.buffer[this.head] = value;
        if(this.indices.ContainsKey(value)){
            throw new Error(`Queue contains duplicate ${value}`);
        }

        this.indices.Set(value, this.head);
        
        this.head++;
        if (this.head >= this.buffer.length) {
            this.head = 0;
        }

        if (this.head == this.tail) {
            //Max capacity reached
            //Expand buffer
            this.ResizeBuffers(this.buffer.length, this.buffer.length * 2);
        }
    }

    private MoveToValid(){
        //Moves the dequeue index past all the skipped elements
        while(this.skip[this.tail]){
            this.tail = (this.tail + 1) % this.skip.length;
        }
    }

    Peek(): number {
        this.MoveToValid();
        return super.Peek();
    }

    Dequeue() : number {
        this.MoveToValid();
        let dequeued = super.Dequeue();
        if(!this.indices.ContainsKey(dequeued)){
            throw new Error(`queue does not contain element ${dequeued}`);
        }
        this.indices.Remove(dequeued);
        return dequeued;
    }
}
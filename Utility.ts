//import { Dictionary, dictKey } from "./Collections/Collections/Collections";
import * as Dict from "./Collections/Dictionary"

export function Clamp(val:number, upper:number, lower:number){
    if(val > upper) return upper;
    if(val < lower) return lower;
    return val;
}

export function PerfectlyDivisible(val:number, divisor:number):boolean{
    let div = val / divisor;
    return Math.floor(div) == div;
}

export function Range(lowerInclusive:number, upperExclusive:number){
    let nElem = upperExclusive - lowerInclusive;
    let arr = new Array(nElem);
    let ind = 0;
    for(let val = lowerInclusive; val < upperExclusive; val += 1){
        arr[ind++] = val;
    }
    return arr;
}

export function Fill<T>(length: number, value: T): T[] {
    let arr = new Array(length);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = value;
    }
    return arr;
}

export function Memset<T>(arr: T[], value: T): void {
    for (let i = 0; i < arr.length; i++) {
        arr[i] = value;
    }
}

export function FillObj<T>(length: number, generator: () => T): T[] {
    let arr = new Array(length);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = generator();
    }
    return arr;
}

export function Fill2DObj<T>(rows: number, cols: number, generator: () => T): T[][] {
    let arr = new Array(rows);
    for (let r = 0; r < rows; r++) {
        let newRow = new Array(cols);
        for (let c = 0; c < cols; c++) {
            newRow[c] = generator();
        }
        arr[r] = newRow;
    }
    return arr;
}

export function Zip<TIn1, TIn2, TOut>(arr1: TIn1[], arr2: TIn2[], fn: (e1: TIn1, e2: TIn2) => TOut): TOut[] {
    if (arr1.length != arr2.length) {
        throw new Error(`Zip: arrays of different length: 1st: ${arr1.length}  2nd: ${arr2.length}`);
    }
    let result = new Array(arr1.length);
    for (let i = 0; i < result.length; i++) {
        result[0] = fn(arr1[i], arr2[i]);
    }
    return result;
}

export function Swap<T>(arr: T[], ind1: number, ind2: number): void {
    let temp = arr[ind1];
    arr[ind1] = arr[ind2];
    arr[ind2] = temp;
}

export function Max(arr: number[]): number {
    let max = arr[0];
    for (let i = 0; i < arr.length; i++) {
        max = Math.max(max, arr[i]);
    }
    return max;
}

export function Sum(arr: number[]): number {
    let acc = 0;
    for (let i = 0; i < arr.length; i++) {
        acc += arr[i];
    }
    return acc;
}

export function HashItems<T>(list: T[], keyGenerator: (item: T) => number): Dict.IHashtable<T> {
    let dict = new Dict.ObjectDict<T>();
    for (let i = 0; i < list.length; i++) {
        let item = list[i];
        let key = keyGenerator(item);
        if (!dict.ContainsKey(key)) {
            dict.Set(key, item);
        }
    }
    return dict;
}

export function Fill2DRect<T>(
    arr: T[][], value: T, x: number, y: number, width: number, height: number): void {
    const right = x + width;
    const bot = y + height;
    for (let r = y; r < bot; r++) {
        for (let c = x; c < right; c++) {
            arr[r][c] = value;
        }
    }
}

export function UniqueRandom(nNumbers: number, upperInclusive: number): number[] {
    if (nNumbers > upperInclusive) throw new Error('UniqueRandom: nNumbers must be smaller than upperInclusive');

    let dict = new Dict.ObjectDict<boolean>();
    let selected = [];
    while (selected.length < nNumbers) {
        let rand = Math.floor(Math.random() * upperInclusive);
        if (!dict.ContainsKey(rand)) {
            selected.push(rand);
            dict.Set(rand, true);
        }
    }

    return selected;
}


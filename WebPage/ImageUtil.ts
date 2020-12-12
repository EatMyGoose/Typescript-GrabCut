import * as Mat from "../Matrix";
import * as Util from "../Utility";
import {Trimap} from "../GrabCut";

export class RGBA {
    //All values are 0-255
    red: number;
    green: number;
    blue: number;
    alpha: number;
    constructor(r: number, g: number, b: number, a: number) {
        this.red = r;
        this.green = g;
        this.blue = b;
        this.alpha = a;
    }

    Equals(other: RGBA): boolean {
        return (
            this.red == other.red &&
            this.green == other.green &&
            this.blue == other.blue &&
            this.alpha == other.alpha);
    }

    EqualsExcludeAlpha(other: RGBA): boolean{
        return (
            this.red == other.red &&
            this.green == other.green &&
            this.blue == other.blue);
    }

    CSSValue():string{
        return `rgba(${this.red},${this.green},${this.blue},${this.alpha / 255})`;
    }
}

export class Temp2DCanvas {
    private canvas: HTMLCanvasElement;
    private hDC: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        let c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        let hDC = c.getContext("2d");

        this.canvas = c;
        this.hDC = hDC;
        this.width = width;
        this.height = height;
    }

    GetHDC() {
        return this.hDC;
    }

    GetImageData() {
        return this.hDC.getImageData(0, 0, this.width, this.height);
    }

    SetImageData(data: ImageData): string {
        this.hDC.putImageData(data, 0, 0);
        return this.canvas.toDataURL();
    }
}

let blankImg: string = null;

export function EmptyImage(): string {
    if (blankImg != null) return blankImg;

    let c = new Temp2DCanvas(1, 1);
    blankImg = c.SetImageData(c.GetImageData());
    return blankImg;
}

export function Trimap2BW(trimap:Trimap[][]):string{
    let [width, height] = [trimap[0].length, trimap.length];
    let canvas = new Temp2DCanvas(width, height);
    let imgData = canvas.GetImageData();
    let arr = imgData.data;
    for(let y = 0; y < height; y++){
        for(let x = 0; x < width; x++){
            let offset = (y * width + x) * 4;
            let lum:number = trimap[y][x] * 122;
            arr[offset + 0] = lum;
            arr[offset + 1] = lum;
            arr[offset + 2] = lum;
            arr[offset + 3] = 255;
        }
    }
    return canvas.SetImageData(imgData);
}

//Converts the 0-255 RGBA representation to 0-1 RGB column vectors 
export function ImageData2Mat(data: ImageData): Mat.Matrix[][] {
    let result: Mat.Matrix[][] = Util.Fill2DObj<Mat.Matrix>(data.height, data.width, () => Mat.CreateMatrix(3, 1));
    let buffer = data.data;
    let coeff = 1;

    for (let r = 0; r < data.height; r++) {
        let rowOffset = r * data.width;
        for (let c = 0; c < data.width; c++) {
            let ind: number = 4 * (rowOffset + c);
            let pixel = result[r][c];
            pixel[0][0] = buffer[ind + 0] * coeff; //R
            pixel[1][0] = buffer[ind + 1] * coeff; //G
            pixel[2][0] = buffer[ind + 2] * coeff; //B
            //alpha will be ignored
        }
    }
    return result;
}

//Creates a new image by applying the alpha mask to the source image
export function ApplyAlphaMask(img: ImageData, alpha: number[][]): string {
    let [width, height] = [img.width, img.height];
    let c = new Temp2DCanvas(width, height);
    let bufferData = c.GetImageData();
    let buffer = bufferData.data;
    //Clone RGB data
    buffer.set(img.data)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let alphaInd = 4 * (width * y + x) + 3;
            buffer[alphaInd] = alpha[y][x] * 255
        }
    }

    return c.SetImageData(bufferData);
}

//BW image from an alpha image
export function CreateBWImage(values: number[][]): string {
    let [width, height] = [values[0].length, values.length];
    let c = new Temp2DCanvas(width, height);
    let img = c.GetImageData();
    let buffer = img.data;
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            let ind = (r * width + c) * 4;
            let lum = values[r][c] * 255;
            buffer[ind + 0] = lum;
            buffer[ind + 1] = lum;
            buffer[ind + 2] = lum;
            buffer[ind + 3] = 255;
        }
    }
    return c.SetImageData(img);
}


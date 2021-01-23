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

//Converts the 0-255 RGBA representation to 0-255 RGB column vectors 
export function ImgData2_1DMat(data: ImageData): Mat.Matrix[] {
    let nPixels = data.width * data.height;
    let result: Mat.Matrix[] = Util.FillObj<Mat.Matrix>(nPixels, () => Mat.CreateMatrix(3,1));
    let buffer = data.data;

    for(let i = 0; i < nPixels; i++){
        let ind = 4 * i;
        let pixel = result[i];
        pixel[0][0] = buffer[ind + 0]; //R
        pixel[1][0] = buffer[ind + 1]; //G
        pixel[2][0] = buffer[ind + 2]; //B
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
            buffer[alphaInd] = 255; alpha[y][x] * 255;
        }
    }

    return c.SetImageData(bufferData);
}

export function FeatherMask(alpha:number[][]): number[][]{
    let [width, height] = [alpha[0].length, alpha.length];
    let feathered:number[][] = Mat.CreateMatrix(height, width);
    let threshold = 0.1;

    let meanKernel = Util.Fill2DObj<number>(3,3, () => 1/9);

    for(let r = 0; r < height; r++){
        for(let c = 0; c < width; c++){
            if(alpha[r][c] < threshold){
                feathered[r][c] = alpha[r][c];
            }else{
                feathered[r][c] = ConvolutionOnPoint(r, c, alpha, height, width, meanKernel, 3, 3, 1, 1);
            }
        }
    }
    return feathered;
}

export function Apply2DConvolution(src:Mat.Matrix, kernel:Mat.Matrix):Mat.Matrix{
    let [nRows, nCols] = Mat.Dimensions(src);
    let [kRows, kCols] = Mat.Dimensions(kernel);

    let [kernelMidRow, kernelMidCol] =  [Math.floor(kRows / 2), Math.floor(kCols / 2)];

    let result = Mat.CreateMatrix(nRows, nCols);

    for(let r = 0; r < nRows; r++){
        for(let c = 0; c < nCols; c++){
            result[r][c] = ConvolutionOnPoint(r,c, src, nRows, nCols, kernel, kRows, kCols, kernelMidRow, kernelMidCol);        
        }
    } 

    return null;
} 

function ConvolutionOnPoint(
    targetRow:number, targetCol:number,
    src:Mat.Matrix, nRows:number, nCols:number, 
    kernel:Mat.Matrix, kRows:number, kCols:number, kMidRowIndex:number, kMidColIndex:number):number{ 
    
    let acc = 0;
    for(let r = 0; r < kRows; r++){
        let destR = targetRow + r - kMidRowIndex;
        if(destR < 0 || destR >= nRows) continue; //Out of bounds
        for(let c = 0; c < kCols; c++){
            let destC = targetCol + c - kMidColIndex;
            if(destC < 0 || destC >= nCols) continue; //Out of bounds
            acc += kernel[r][c] * src[destR][destC];
        }
    }
    return acc;
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

//Mask -> values range from [0(transparent), 1(opaque)] 
export function ApplyAlphaMaskToImgData(original:ImageData, alpha:number[][]):ImageData{
    let [width, height] = [original.width, original.height];
    let imgCopy = new ImageData(width, height);
    let buffer = imgCopy.data;

    buffer.set(original.data); //Deepcopy the original pixel data

    //Assign alpha values
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let alphaInd = 4 * (width * y + x) + 3;
            buffer[alphaInd] = alpha[y][x] * 255;
        }
    }

    return imgCopy;
}

class BinaryWriter{
    private buffer:Uint8Array;
    private cursor:number = 0;
    private littleEndian = true;
    private view:DataView;

    constructor(buffer:Uint8Array, littleEndian:boolean){
        this.buffer = buffer;
        this.littleEndian = littleEndian;
        this.view = new DataView(buffer.buffer);
    }

    Seek(cursor:number){
        this.cursor = cursor;
    }

    Cursor():number{
        return this.cursor;
    }

    WriteInt(val:number){
        this.view.setInt32(this.cursor, val, this.littleEndian);
        this.cursor += 4;
    }

    WriteShort(val:number){
        this.view.setInt16(this.cursor, val, this.littleEndian);
        this.cursor += 2;
    }

    WriteByte(val:number){
        this.view.setUint8(this.cursor, val);
        this.cursor += 1;
    }

    BlockCopyArray(source:Uint8Array | Uint8ClampedArray){
        this.buffer.set(source, this.cursor);
        this.cursor += source.length;
    }

    GetBuffer(){
        return this.buffer;
    }
}

export function ImgData2URL(data:ImageData):string{
    let [width, height] = [data.width, data.height];
    const headerSize = 14;
    const infoHeaderSize = 108;
    let imgDataSize = width * height * 4; //4bpp
    let totalSize = imgDataSize + infoHeaderSize + headerSize;
    let bw = new BinaryWriter(new Uint8Array(totalSize), true);

    //Header

    //BM
    bw.WriteByte(0x42);
    bw.WriteByte(0x4D);

    bw.WriteInt(totalSize);

    bw.WriteShort(0);
    bw.WriteShort(0);

    let imgDataIndex = headerSize + infoHeaderSize;
    bw.WriteInt(imgDataIndex);

    //InfoHeader

    //Bitmapinfoheader
    bw.WriteInt(infoHeaderSize);
    bw.WriteInt(width);
    bw.WriteInt(-height);//Negative height - Top down image
    bw.WriteShort(1); //Colour planes, always 1
    
    const bitsPerPixel = 32; //ARGB
    bw.WriteShort(bitsPerPixel);

    const BI_RGB = 0;
    const BI_BITFIELDS = 3;
    bw.WriteInt(BI_BITFIELDS);
    bw.WriteInt(imgDataSize);

    const inchesPerMetre = 39;
    const hRes = 72 * inchesPerMetre; //pixels per meter
    const vRes = 72 * inchesPerMetre; //pixels per meter
    bw.WriteInt(hRes);
    bw.WriteInt(vRes);

    const nColours = 0; //0 for default
    bw.WriteInt(nColours);

    const importantColours = 0;
    bw.WriteInt(importantColours);

    
    //BITMAPV4HEADER extensions
    const R_MASK = 0x00FF0000;
    const G_MASK = 0x0000FF00;
    const B_MASK = 0x000000FF;
    const A_MASK = 0xFF000000;

    bw.WriteInt(R_MASK);
    bw.WriteInt(G_MASK);
    bw.WriteInt(B_MASK);
    bw.WriteInt(A_MASK);

    const LCS_DEVICE_RGB = 1;
    bw.WriteInt(LCS_DEVICE_RGB);
    
    const CIEXYZTRIPLE_SIZE = 36;
    for(let i = 0; i <  CIEXYZTRIPLE_SIZE; i++) bw.WriteByte(0);

    bw.WriteInt(0);
    bw.WriteInt(0);
    bw.WriteInt(0);
    //

    //Bitmap data
    //Top down data
    bw.BlockCopyArray(data.data);

    //RGBA -> BGRA
    let buffer = bw.GetBuffer();
    for(let i = imgDataIndex; i < buffer.length; i += 4){
        //Swap R & B;
        let temp = buffer[i];
        buffer[i] = buffer[i + 2];
        buffer[i + 2] = temp;
    }

    let bmp = new Blob([buffer.buffer], {type:"image/bmp"});
    return URL.createObjectURL(bmp);
}


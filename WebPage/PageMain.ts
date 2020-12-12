import { FileInput } from "./FileInput";
import { CanvasView } from "./CanvasView";
import { Model } from "./Model";
import { Controller } from "./Controller";
import { PreviewView } from "./PreviewView";
//Entry point

let imgCanvas = <HTMLCanvasElement>document.getElementById("canvas-main");
let editCanvas = <HTMLCanvasElement>document.getElementById("canvas-top");
let cropBtn = <HTMLInputElement>document.getElementById("btn-crop");
let previewImg = <HTMLImageElement>document.getElementById("img-preview");
let btnAlpha = <HTMLButtonElement>document.getElementById("btn-alpha");
let btnImage = <HTMLButtonElement>document.getElementById("btn-img");
let download = <HTMLAnchorElement>document.getElementById("a-download");

let radiusRange = <HTMLInputElement>document.getElementById("range-brush-size");
let brushRadioBtns = <HTMLInputElement[]>Array.from(document.getElementsByName("brush"));

let file = new FileInput("file-image");

let view = new CanvasView(imgCanvas, editCanvas);
let previewView = new PreviewView(previewImg, btnAlpha, btnImage, download);
let model = new Model();
let controller = new Controller(file, imgCanvas, cropBtn, brushRadioBtns, radiusRange);

view.AttachModel(model);

previewView.AttachModel(model);
previewView.AttachEditorView(view);

model.AttachView(view);
model.AttachPreviewView(previewView);

controller.AttachModel(model);
controller.AttachView(view);

console.log("Main loaded");

console.log("PageMain loaded");

import { FileInput } from "./FileInput";
import { CanvasView } from "./CanvasView";
import { Model } from "./Model";
import { Controller,AdvancedControls } from "./Controller";
import { PreviewView } from "./PreviewView";

//Entry point

//Preview window
let previewImg = <HTMLImageElement>document.getElementById("img-preview");
let btnAlpha = <HTMLButtonElement>document.getElementById("btn-alpha");
let btnImage = <HTMLButtonElement>document.getElementById("btn-img");
let download = <HTMLAnchorElement>document.getElementById("a-download");
let featherMask = <HTMLInputElement>document.getElementById("checkbox-antialias");

//Drawing controls
let file = new FileInput("file-image");

let imgCanvas = <HTMLCanvasElement>document.getElementById("canvas-main");
let editCanvas = <HTMLCanvasElement>document.getElementById("canvas-top");
let cropBtn = <HTMLInputElement>document.getElementById("btn-crop");
let radiusRange = <HTMLInputElement>document.getElementById("range-brush-size");
let brushRadioBtns = <HTMLInputElement[]>Array.from(document.getElementsByName("brush"));

//Advanced controls
let tbMaxIter = new ValidatedTextbox("text-max-iter");
let tbTolerance = new ValidatedTextbox("text-iter-convergence");
let tbCohesion = new ValidatedTextbox("text-cohesiveness");
let tbFGClusters = new ValidatedTextbox("text-fg-gmms");
let tbBGClusters = new ValidatedTextbox("text-bg-gmms");

let advControls:AdvancedControls = {
    tbMaxIter,
    tbTolerance,
    tbCohesion,
    tbFGClusters,
    tbBGClusters
} 


let view = new CanvasView(imgCanvas, editCanvas);
let previewView = new PreviewView(previewImg, btnAlpha, btnImage, download, featherMask);
let model = new Model();
let controller = new Controller(file, imgCanvas, cropBtn, brushRadioBtns, radiusRange, advControls);

view.AttachModel(model);

previewView.AttachModel(model);
previewView.AttachEditorView(view);

model.AttachView(view);
model.AttachPreviewView(previewView);

controller.AttachModel(model);
controller.AttachView(view);

import { FileInput } from "./FileInput";
import { Editor } from "./Editor";
import { CanvasView } from "./View";
import { Model } from "./Model";
import { Controller } from "./Controller";
import { PreviewView } from "./PreviewView";
//Entry point

let canvas = <HTMLCanvasElement>document.getElementById("canvas-main");
let cropBtn = <HTMLInputElement>document.getElementById("btn-crop");
let previewImg = <HTMLImageElement>document.getElementById("img-preview");
let btnAlpha = <HTMLButtonElement>document.getElementById("btn-alpha");
let btnImage = <HTMLButtonElement>document.getElementById("btn-img");
let download = <HTMLAnchorElement>document.getElementById("a-download");

let file = new FileInput("file-image");

let view = new CanvasView(canvas);
let previewView = new PreviewView(previewImg, btnAlpha, btnImage, download);
let model = new Model();
let controller = new Controller(file, canvas, cropBtn);

view.AttachModel(model);

previewView.AttachModel(model);
previewView.AttachEditorView(view);

model.AttachView(view);
model.AttachPreviewView(previewView);

controller.AttachModel(model);
controller.AttachView(view);

console.log("Main loaded");

console.log("PageMain loaded");

import { Model } from "./Model";
import * as IMUtil from "./ImageUtil";
import { CanvasView } from "./CanvasView";

enum SelectedView{
    image = 0,
    alpha = 1      
}

//View & Controller
export class PreviewView{

    private currentView:SelectedView = SelectedView.image;
    private img: HTMLImageElement;
    private model: Model;
    private download: HTMLAnchorElement;
    private featherMask: HTMLInputElement;

    private editorView: CanvasView;

    constructor(img:HTMLImageElement, alphaBtn: HTMLButtonElement, imageBtn:HTMLButtonElement, download: HTMLAnchorElement, featherMask:HTMLInputElement){
        this.img = img;
        this.download = download;
        this.featherMask = featherMask;

        alphaBtn.addEventListener("click", () => this.SwitchView(SelectedView.alpha));
        imageBtn.addEventListener("click", () => this.SwitchView(SelectedView.image));
        featherMask.addEventListener("change", () => this.Draw());
    }

    AttachEditorView(this:PreviewView, editorView:CanvasView){
        this.editorView = editorView;
    }

    AttachModel(this:PreviewView, model:Model):void{
        this.model = model;
    }

    Draw():void{
        let showAlphaMask = this.currentView == SelectedView.alpha;
        let featherMask = this.featherMask.checked;

        let src = this.model.GetCroppedImageURL(showAlphaMask, featherMask);
        this.img.src = (src != null)? src : IMUtil.EmptyImage(); 

        if(src != null){
            this.download.setAttribute("href", src);
            this.download.setAttribute("download", (showAlphaMask)? "mask.bmp": "cropped.bmp");
        }else{
            this.download.removeAttribute("href");
        }
        
        let [width, height] = this.editorView.GetPreviewDim();
        this.img.style.width = `${width}px`;
        this.img.style.height = `${height}px`;
    }

    private SwitchView(view:SelectedView):void{
        if(this.currentView != view){
            this.currentView = view;
            this.Draw();
        }
    }

}
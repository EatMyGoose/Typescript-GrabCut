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

    private editorView: CanvasView;

    constructor(img:HTMLImageElement, alphaBtn: HTMLButtonElement, imageBtn:HTMLButtonElement, download: HTMLAnchorElement){
        this.img = img;
        this.download = download;

        alphaBtn.addEventListener("click", () => this.SwitchView(SelectedView.alpha));
        imageBtn.addEventListener("click", () => this.SwitchView(SelectedView.image));
    }

    AttachEditorView(this:PreviewView, editorView:CanvasView){
        this.editorView = editorView;
    }

    AttachModel(this:PreviewView, model:Model):void{
        this.model = model;
    }

    Draw():void{
        let showAlphaMask = this.currentView == SelectedView.alpha;

        let src = this.model.GetCroppedImageURL(showAlphaMask);
        this.img.src = (src != null)? src : IMUtil.EmptyImage(); 

        if(src != null){
            this.download.setAttribute("href", src);
            this.download.setAttribute("download", (showAlphaMask)? "mask.bmp": "cropped.bmp");
        }else{
            this.download.removeAttribute("href");
        }
        
        let drawRect = this.editorView.GetDrawRegion();
        let [width, height] = [drawRect.width, drawRect.height];
        this.img.style.width = `${width}px`;
        this.img.style.height = `${height}px`;
    }

    private SwitchView(this:PreviewView, view:SelectedView):void{
        if(this.currentView != view){
            this.currentView = view;
            this.Draw();
        }
    }

}
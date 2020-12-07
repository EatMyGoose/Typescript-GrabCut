export type CallbackAction = () => void;

export class FileInput {
    private element: HTMLInputElement;
    private listeners: CallbackAction[] = [];
    private data: string;

    constructor(id: string) {
        this.element = <HTMLInputElement>document.getElementById(id);
        let listener = (arg:Event) => this.ProcessInputChange(arg, this);
        this.element.addEventListener("change", listener as EventListener);
        this.data = null;
    }

    private ProcessInputChange(arg: Event, self:FileInput): void {
        if (self.element.value.length > 0) {
            let reader = new FileReader();
            reader.onload = () => {
                self.data = <string>reader.result;
                self.listeners.forEach(l => l());
            }
            reader.readAsDataURL(self.element.files[0]);
        }
    }

    GetDataURL(): string {
        return this.data;
    }

    RegisterImageLoad(callback: CallbackAction): void {
        console.log(callback);
        this.listeners.push(callback);
    }
}
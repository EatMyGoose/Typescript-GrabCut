enum ErrorType{
    Low,
    High,
    NaN,
    None
}

class ValidatedTextbox{
    private tb: HTMLInputElement;
    private min:number = Number.MIN_SAFE_INTEGER;
    private max:number = Number.MAX_SAFE_INTEGER;
    private default:number = 0;
    private errClassName:string;

    constructor(id:string){
        this.tb = <HTMLInputElement>document.getElementById(id);
        if(!this.tb){
            throw new Error(`Missing input element:${id}`);
        }

        this.default = this.parseAttrAsFloat("data-default");
        this.errClassName = this.tb.getAttribute("data-err-class");

        this.min = this.parseAttrAsFloat("min");
        this.max = this.parseAttrAsFloat("max");

        this.tb.addEventListener("input", this.CheckInput.bind(this));
    }

    private static Validate(raw:string, max:number, min:number) : ErrorType{
        let parsed = parseFloat(raw);
        if(isNaN(parsed)) return ErrorType.NaN;

        if(parsed > max) return ErrorType.High;

        if(parsed < min) return ErrorType.Low;

        return ErrorType.None;
    }

    private CheckInput(){
        let error = ValidatedTextbox.Validate(this.tb.value, this.max, this.min);
        if(error != ErrorType.None){
            this.tb.classList.add(this.errClassName);
        }else{
            this.tb.classList.remove(this.errClassName);
        }

        this.tb.value = this.tb.value;
    }

    private parseAttrAsFloat(attributeName:string):number{
        let str = this.tb.getAttribute(attributeName);
        let parsed = parseFloat(str);
        let successful = !isNaN(parsed);
        if(!successful){
            throw new Error(`Error parsing attribute ${attributeName} (value:${str}) as a number`);
        }
        return parsed;
    }

    GetValue():number{
        let err = ValidatedTextbox.Validate(this.tb.value, this.max, this.min);
        switch(err){
            case ErrorType.None:{
                return parseFloat(this.tb.value);
            }
            case ErrorType.NaN:{
                return this.default;
            }
            case ErrorType.High:{
                return this.max;
            }
            case ErrorType.Low:{
                return this.min;
            }
            default:{
                throw new Error("Argument out of range");
            }
        }
    }
}
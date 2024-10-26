
//Use a .d.ts to suppress the error from this override
declare const Reflect: {
	get(thing:any, key:string):any;
	set(thing:any, key:string, value:any):void;
}

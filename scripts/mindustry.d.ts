
//Use .d.ts to prevent this from erroring
declare const Reflect: {
	get(thing:any, key:string):any;
	set(thing:any, key:string, value:any):void;
}

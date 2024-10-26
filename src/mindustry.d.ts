/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains one single declaration from mindustryTypes.ts that cannot go in there.
*/


//Use a .d.ts to suppress the error from this override
declare const Reflect: {
	get(thing:any, key:string):any;
	set(thing:any, key:string, value:any):void;
}

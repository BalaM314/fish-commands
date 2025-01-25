/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the menu system.
*/

import { CommandError } from "./commands";
import { FishPlayer } from "./players";
import { outputFail, outputSuccess } from "./utils";
import { parseError } from './funcs';
import { to2DArray } from './funcs';


//#region Draw Menu

/** Stores a mapping from name to the numeric id of a listener that has been registered. */
const registeredListeners:{
	[index:string]: number;
} = {};
/** Stores all listeners in use by fish-commands. */
const listeners = (
	<T extends Record<string, (player:mindustryPlayer, option:number) => void>>(d:T) => d
)({
	generic(player, option){
		const fishSender = FishPlayer.get(player);
		if(option === -1 || option === fishSender.activeMenu.cancelOptionId) return;

		const prevCallback = fishSender.activeMenu.callback;
		fishSender.activeMenu.callback?.(fishSender, option);
		//if the callback wasn't modified, then clear it
		if(fishSender.activeMenu.callback === prevCallback)
			fishSender.activeMenu.callback = undefined;
		//otherwise, the menu spawned another menu that needs to be handled
	},
	none(player, option){
		//do nothing
	}
});

/** Registers all listeners, should be called on server load. */
export function registerListeners(){
	for(const [key, listener] of Object.entries(listeners)){
		registeredListeners[key] ??= Menus.registerMenu(listener);
	}
}



/** Displays a menu to a player. */
function menu(title:string, description:string, elements:GUI_Element[], target:FishPlayer):void;
/** Displays a menu to a player with callback. */
function menu(
	title:string, description:string, elements:GUI_Element[], target:FishPlayer,
	callback: (opts: {
		data:any, text:string, sender:FishPlayer, outputSuccess:(message:string) => void, outputFail:(message:string) => void;
	}) => void,
	
):void;
//this is a minor abomination but theres no good way to do overloads in typescript
function menu(
	title:string, description:string, elements:GUI_Element[], target:FishPlayer,
	callback?: (opts: {
		data:any, text:string, sender:FishPlayer, outputSuccess:(message:string) => void, outputFail:(message:string) => void;
	}) => void,
){
	//target.activeMenu.cancelOptionId = -1; GUI_Cancel handles cancel already

	let ArrangedElements = { data:[] as any[][], stringified:[] as string[][] }
	elements.forEach(element => {
		ArrangedElements.data.push(...element.data());
	});
	elements.forEach(element => ArrangedElements.stringified.push(...element.format()));

	//flatten to arrays 
	let PackedElements = { data:ArrangedElements.data.flat(), stringified:ArrangedElements.stringified.flat() }
	if(PackedElements.data.length == 0){
		ArrangedElements.stringified.push(["<No Options Provided>"])
		ArrangedElements.data.push([null]); // not needed, but nice to keep data and string in sync.
	}
	if(!callback){
		//overload 1, just display a menu with no callback
		Call.menu(target.con, registeredListeners.none, title, description, ArrangedElements.stringified);
	} else {
		//overload 2, display a menu with callback
	
		//The target fishPlayer has a property called activeMenu, which stores information about the last menu triggered.
		target.activeMenu.callback = (_fishSender, option) => {
			//Additional permission validation could be done here, but the only way that callback() can be called is if the above statement executed,
			//and on sensitive menus such as the stop menu, the only way to reach that is if menu() was called by the /stop command,
			//which already checks permissions.
			//Additionally, the callback is cleared by the generic menu listener after it is executed.

			//We do need to validate option though, as it can be any number.
			if(!(option in PackedElements.data)) return;
			if(typeof PackedElements.data[option] === 'string' && PackedElements.data[option] == "cancel"){return;} // cancel button pressed, no need to callback
			try {
				callback({
					data: PackedElements.data[option],
					text: PackedElements.stringified[option],
					sender: target,
					outputFail: message => outputFail(message, target),
					outputSuccess: message => outputSuccess(message, target),
				});
			} catch(err){
				if(err instanceof CommandError){
					//If the error is a command error, then just outputFail
					outputFail(err.data, target);
				} else {
					target.sendMessage(`[scarlet]\u274C An error occurred while executing the command!`);
					if(target.hasPerm("seeErrorMessages")) target.sendMessage(parseError(err));
					Log.err(`Unhandled error in menu callback: ${target.cleanedName} submitted menu "${title}" "${description}"`);
					Log.err(err as Error);
				}
			}
		};
	
		Call.menu(target.con, registeredListeners.generic, title, description, ArrangedElements.stringified);
	}

}
//#endregion
//#region Draw Page Menus

//draws a page menu with arbitrary pages
export function pageMenu(title:string, description:string, elements:GUI_Element[][], target:FishPlayer, callback: (opts: {data:any, text:string, sender:FishPlayer, outputSuccess:(message:string) => void, outputFail:(message:string) => void;}) => void){
	let pages = elements.length
	function drawpage(index:number){
		let e:GUI_Element[] = [new GUI_Page(index+1,pages)]
		e.push(...elements[index])
		menu(title,description,e, target, (res) => {
			if(typeof res.data === 'string'){
				switch (res.data) {
					case "left":
						drawpage((index == 0)?(0):(index-1));
						break;
					case "right":
						drawpage((index == pages-1)?(pages-1):(index+1));
						break;
					case "center":
						drawpage(index);
						break;
				default:
					callback(res);	
				}
			}
		})
		return;
	}
	 
}
//auto formats a array into a page menu
//TODO make list a GUI_Element[] instead of a single Container
export function listMenu(title:string, description:string, list:GUI_Container,target:FishPlayer, callback: (opts: {data:any, text:string, sender:FishPlayer, outputSuccess:(message:string) => void, outputFail:(message:string) => void;}) => void, pageSize:number = 10){
	let buttons = { data:[] as any[][],}
	list.data()[0].reduce((result, _, index) => { if (index % pageSize === 0) { buttons.data.push(buttons.data.slice(index, index + pageSize));}return result;});
	let pages:GUI_Element[][] = [];
	buttons.data.forEach(page => {pages.push([new GUI_Container(page,1,list.stringifier)])})//wrap each page in a container
	pageMenu(title,description,pages,target,callback);
}
//#endregion
//#region GUI Elements

interface GUI_Element{
	format():string[][],
	data():any[][]
}

//const reservedStrings = ["left", "center", "right"] // strings used for paged menus, cannot be handled correct
export class GUI_Container implements GUI_Element {
	constructor(
		public options:any[], 
		public columns:number | "auto" = 3,
		public stringifier:((option:any) => string) = option => option as unknown as string
	){};
	format = () => {return(to2DArray(this.options.map(this.stringifier), (this.columns == 'auto')?(3):(this.columns)))};
	data = () => {return to2DArray(this.options, (this.columns == 'auto')?(3):(this.columns))};
}
export class GUI_Cancel implements GUI_Element{
	format = () => {return([["cancel"]])};
	data = () => {return([["cancel"]])}
}
export class GUI_Page implements GUI_Element{
	constructor(
		public currentPage:number,
		public pages:number
	){}
	public format = () => {return([["<--"], [`${this.currentPage}/${this.pages}`], ["-->"]])};
	public data = () => {return([["left","center","left"]])}

}
export class GUI_Confirm implements GUI_Element{
	public format = () => {return[["[green]Yes, do it", "[red] No, cancel"]]}
	public data = () => {return[[true, false]]}
}
//#endregion
//#region Exports
export {
	registeredListeners as listeners,
	menu
};



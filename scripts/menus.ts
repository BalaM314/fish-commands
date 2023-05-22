import { FishPlayer } from "./players";
import { to2DArray } from "./utils";

/**Stores a mapping from name to the numeric id of a listener that has been registered. */
const registeredListeners:{
	[index:string]: number;
} = {};
/**Stores all listeners in use by fish-commands. */
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

/**Registers all listeners, should be called on server load. */
export function registerListeners(){
	for(const [key, listener] of Object.entries(listeners)){
		registeredListeners[key] ??= Menus.registerMenu(listener);
	}
}

/**Displays a menu to a player. */
function menu(title:string, description:string, options:string[], target:FishPlayer):void;
/**Displays a menu to a player with callback. */
function menu<T>(
	title:string, description:string, options:T[], target:FishPlayer,
	callback: (opts: {
		option:T, sender:FishPlayer, outputSuccess:(message:string) => void, outputFail:(message:string) => void;
	}) => void,
	includeCancel?:boolean, optionStringifier?:(opt:T) => string, columns?:number
):void;
//this is a minor abomination but theres no good way to do overloads in typescript
function menu<T>(
	title:string, description:string, options:T[], target:FishPlayer,
	callback?: (opts: {
		option:T, sender:FishPlayer, outputSuccess:(message:string) => void, outputFail:(message:string) => void;
	}) => void,
	includeCancel:boolean = true,
	optionStringifier:(opt:T) => string = t => t as any as string, //this is dubious
	columns:number = 3,
){

	if(!callback){
		//overload 1, just display a menu with no callback
		Call.menu(target.con, registeredListeners.none, title, description, options.length == 0 ? [["<no options>"]] : to2DArray(options.map(optionStringifier), columns));
	} else {
		//overload 2, display a menu with callback

		//Set up the 2D array of options, and add cancel
		//Use "<no options>" as a fallback, because Call.menu with an empty array of options causes a client crash
		const arrangedOptions = (options.length == 0 && !includeCancel) ? [["<no options>"]] : to2DArray(options.map(optionStringifier), columns);
		if(includeCancel){
			arrangedOptions.push(["Cancel"]);
			target.activeMenu.cancelOptionId = options.length;
		} else {
			target.activeMenu.cancelOptionId = -1;
		}
	
		//The target fishPlayer has a property called activeMenu, which stores information about the last menu triggered.
		target.activeMenu.callback = (fishSender, option) => {
			//Additional permission validation could be done here, but the only way that callback() can be called is if the above statement executed,
			//and on sensitive menus such as the stop menu, the only way to reach that is if menu() was called by the /stop command,
			//which already checks permissions.
			//Additionally, the callback is cleared by the generic menu listener after it is executed.

			//We do need to validate option though, as it can be any number.
			if(!(option in options)) return;
			callback({
				option: options[option],
				sender: target,
				outputFail(message:string){
					target.sendMessage(`[scarlet]⚠ [yellow]${message}`);
				},
				outputSuccess(message:string){
					target.sendMessage(`[#48e076]✔ ${message}`);
				}
			});
		};
	
		Call.menu(target.con, registeredListeners.generic, title, description, arrangedOptions);
	}

}

export {
	registeredListeners as listeners,
	menu
};
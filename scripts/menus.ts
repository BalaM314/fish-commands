import { FishPlayer } from "./players";
import { to2DArray } from "./utils";

const registeredListeners:{
	[index:string]: number;
} = {};
const listeners = (
	<T extends Record<string, (player:mindustryPlayer, option:number) => void>>(d:T) => d
)({ 
	generic(player, option){
		const fishSender = FishPlayer.get(player);
		if (option === -1 || option === fishSender.activeMenu.cancelOptionId) return;

		fishSender.activeMenu.callback?.(fishSender, option);
		fishSender.activeMenu.callback = undefined;
	},
	none(player, option){
		//do nothing
	}
});

Events.on(ServerLoadEvent, (e) => {
  for(const key of Object.keys(listeners)){
		registeredListeners[key] ??= Menus.registerMenu(listeners[key as keyof typeof listeners]);
	}
});

/**Displays a menu to a player. */
function menu(title:string, description:string, options:string[][], target:FishPlayer):void;
/**Displays a menu to a player with callback. */
function menu<T>(
	title:string, description:string, options:T[], target:FishPlayer,
	callback: (opts: {
		option:T, sender:FishPlayer, outputSuccess:(message:string) => void, outputFail:(message:string) => void;
	}) => void,
	includeCancel:boolean, optionStringifier:(opt:T) => string
):void;
//this is a minor abomination but theres no good way to do overloads in typescript
function menu<T>(
	title:string, description:string, options:T[], target:FishPlayer,
	callback?: (opts: {
		option:T, sender:FishPlayer, outputSuccess:(message:string) => void, outputFail:(message:string) => void;
	}) => void,
	includeCancel:boolean = true,
	optionStringifier:(opt:T) => string = t => t as any as string //this is dubious
){

	if(!callback){
		//overload 1, just display a menu with no callback
		Call.menu(target.player.con, registeredListeners.none, title, description, options);
	} else {
		//overload 2, display a menu with callback

		//Set up the 2D array of options, and add cancel
		const arrangedOptions = to2DArray(options.map(optionStringifier), 3);
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
					target.player.sendMessage(`[scarlet]⚠ [yellow]${message}`);
				},
				outputSuccess(message:string){
					target.player.sendMessage(`[#48e076]${message}`);
				}
			});
		};
	
		Call.menu(target.player.con, registeredListeners.generic, title, description, arrangedOptions);
	}

}

export {
	registeredListeners as listeners,
	menu
};
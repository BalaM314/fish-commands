/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the menu system.
*/

import { CommandError, fail } from "./commands";
import { FishPlayer } from "./players";
import { outputFail } from "./utils";
import { parseError } from './funcs';
import { to2DArray } from './funcs';
import { Promise } from "./promise";

/** Used to change the behavior of adding another menu when being run in a menu callback. */
let isInMenuCallback = false;
/** Stores a mapping from name to the numeric id of a listener that has been registered. */
const registeredListeners: Record<string, number> = {};
/** Stores all listeners in use by fish-commands. */
const listeners = {
	generic(player, option){
		const fishSender = FishPlayer.get(player);

		const prevCallback = fishSender.activeMenus.shift();
		if(!prevCallback) return; //No menu to process, do nothing
		isInMenuCallback = true;
		prevCallback.callback(option);
		isInMenuCallback = false;
	},
	none(player, option){
		//do nothing
	}
} satisfies Record<string, (player:mindustryPlayer, option:number) => void>;

/** Registers all listeners, should be called on server load. */
export function registerListeners(){
	for(const [key, listener] of Object.entries(listeners)){
		registeredListeners[key] ??= Menus.registerMenu(listener);
	}
}

type MenuConfirmProps = {
	cancelOutput?: string;
	title?: string;
	confirmText?: string;
	cancelText?: string;
};

export const Menu = {
	/** Displays a menu to a player, returning a Promise. */
	menu<const TOption, TCancelBehavior extends "ignore" | "reject" | "null" = "ignore">(
		this:void, title:string, description:string, options:TOption[], target:FishPlayer,
		{
			includeCancel = false,
			optionStringifier = String,
			columns = 3,
			onCancel = "ignore" as never,
			cancelOptionId = -1,
		}:{
			/** [red]Cancel[] will be added to the list of options. */
			includeCancel?:boolean;
			optionStringifier?:(opt:TOption) => string;
			columns?:number;
			/**
			 * Specifies the behavior when the player cancels the menu (by clicking Cancel, or by pressing Escape). 
			 * @default "ignore"
			 */
			onCancel?: TCancelBehavior;
			cancelOptionId?: number;
		} = {}
	){
		const { promise, reject, resolve } = Promise.withResolvers<
			(TCancelBehavior extends "null" ? null : never) | TOption,
			TCancelBehavior extends "reject" ? "cancel" : never
		>();

		//Set up the 2D array of options, and maybe add cancel
		//Call.menu() with [[]] will cause a client crash, make sure to pass [] instead
		const arrangedOptions = (options.length == 0 && !includeCancel) ? [] : to2DArray(options.map(optionStringifier), columns);

		if(includeCancel){
			arrangedOptions.push(["Cancel"]);
			cancelOptionId = options.length;
		}
	
		//The target fishPlayer has a property called activeMenu, which stores information about the last menu triggered.
		//If menu() is being called from a menu calback, add it to the front of the queue so it is processed before any other menus.
		//Otherwise, two multi-step menus queued together would alternate, which would confuse the player.
		target.activeMenus[isInMenuCallback ? "unshift" : "push"]({ callback(option){
			//Additional permission validation could be done here, but the only way that callback() can be called is if the above statement executed,
			//and on sensitive menus such as the stop menu, the only way to reach that is if menu() was called by the /stop command,
			//which already checks permissions.
			//Additionally, the callback is cleared by the generic menu listener after it is executed.
	
			try {
				//We do need to validate option though, as it can be any number.
				if(option === -1 || option === cancelOptionId || !(option in options)){
					//Consider any invalid option to be a cancellation
					if(onCancel == "null") resolve(null as never);
					else if(onCancel == "reject") reject("cancel" as never);
					else return;
				} else {
					resolve(options[option]);
				}
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
		}});
	
		Call.menu(target.con, registeredListeners.generic, title, description, arrangedOptions);
		return promise;
	},
	/** Rejects with a CommandError if the user chooses to cancel. */
	confirm(target:FishPlayer, description:string, {
		cancelOutput = "Cancelled.",
		title = "Confirm",
		confirmText = "[green]Confirm",
		cancelText = "[red]Cancel",
	}:MenuConfirmProps = {}){
		return Menu.menu(
			title, description, [confirmText, cancelText], target,
			{ onCancel: "reject", cancelOptionId: 1 }
		).catch(e => {
			if(e === "cancel") fail(cancelOutput);
			throw e; //some random error, rethrow it
		});
	},
	/** Same as confirm(), but with inverted colors, for potentially dangerous actions. */
	confirmDangerous(target:FishPlayer, description:string, {
		confirmText = "[red]Confirm",
		cancelText = "[green]Cancel",
		...rest
	}:MenuConfirmProps = {}){
		return this.confirm(target, description, { cancelText, confirmText, ...rest });
	},
}

export { registeredListeners as listeners };

/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains mutable global variables, and global constants.
*/

import { EventEmitter } from "./funcs";
import { FishPlayer } from "./players";

export const tileHistory:Record<string, string> = {};
export const recentWhispers:Record<string, string> = {};
export const fishState = {
	restartQueued: false,
	restartLoopTask: null as null | TimerTask,
	corruption_t1: null as null | TimerTask,
	corruption_t2: null as null | TimerTask,
	lastPranked: Date.now(),
	labels: [] as TimerTask[],
	peacefulMode: false,
	joinBell: false,
};
export const fishPlugin = {
	directory: null as null | string,
	version: null as null | string,
};
export const ipJoins = new ObjectIntMap<string>(); //todo somehow tell java that K is String and not Object

export const uuidPattern = /^[a-zA-Z0-9+/]{22}==$/;
export const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
export const ipPortPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/;
export const ipRangeCIDRPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/(1[2-9]|2[0-4])$/; //Disallow anything bigger than a /12
export const ipRangeWildcardPattern = /^(\d{1,3}\.\d{1,3})\.(?:(\d{1,3}\.\*)|\*)$/; //Disallow anything bigger than a /16
export const maxTime = 9999999999999;

export const FishEvents = new EventEmitter<{
	/** Fired after a team change. The current team is player.team() */
	playerTeamChange: [player:FishPlayer, previous:Team];
}>();

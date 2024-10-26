/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains mutable global variables, and global constants.
*/

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
};
export const ipJoins = new ObjectIntMap<string>(); //todo somehow tell java that K is String and not Object

export const uuidPattern = /^[a-zA-Z0-9+/]{22}==$/;
export const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
export const ipPortPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/;
export const ipRangeCIDRPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/(1[2-9]|2[0-4])$/; //Disallow anything bigger than a /12
export const ipRangeWildcardPattern = /^(\d{1,3}\.\d{1,3})\.(?:(\d{1,3}\.\*)|\*)$/; //Disallow anything bigger than a /16



export const tileHistory:Record<string, string> = {};
export const recentWhispers:Record<string, string> = {};
export const fishState = {
	restartQueued: false,
	restartLoopTask: null,
	corruption_t1: null,
	corruption_t2: null,
	lastPranked: Date.now(),
};
export const uuidPattern = /^[a-zA-Z0-9+/]{22}==$/;
export const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
export const ipPortPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/;
export const ipJoins = new ObjectIntMap<string>(); //todo somehow tell java that K is String and not Object

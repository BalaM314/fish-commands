import { getGamemode, ip, localDebug, maxTime } from './config';
import { FishPlayer } from './players';

/** Mark a player as stopped until time */
export function addStopped(uuid: string, time:number) {
	if(localDebug) return;
	const req = Http.post(`http://${ip}:5000/api/addStopped`, JSON.stringify({ id: uuid, time }))
		.header('Content-Type', 'application/json')
		.header('Accept', '*/*');
	req.timeout = 10000;
	req.error(() => Log.err(`[API] Network error when trying to call api.addStopped()`));
	req.submit((response) => {
		//Log.info(response.getResultAsString());
	});
}

/** Mark a player as freed */
export function free(uuid: string) {
	if(localDebug) return;
	const req = Http.post(`http://${ip}:5000/api/free`, JSON.stringify({ id: uuid }))
		.header('Content-Type', 'application/json')
		.header('Accept', '*/*');
	req.timeout = 10000;
	req.error(() => Log.err(`[API] Network error when trying to call api.free()`));
	req.submit((response) => {
		//Log.info(response.getResultAsString());
	});
}

/**
 * Gets a player's unmark time from the API.
 * If callbackError is undefined, callback will be called with null on error.
 **/
export function getStopped(uuid:string, callback: (unmark:number | null) => unknown):void;
export function getStopped(uuid:string, callback: (unmark:number) => unknown, callbackError: (errorMessage:Throwable) => unknown):void;
export function getStopped(uuid:string, callback: (unmark:any) => unknown, callbackError?: (errorMessage:Throwable) => unknown){
	function fail(err:string){
		Log.err(`[API] Network error when trying to call api.getStopped()`);
		if(err) Log.err(err);
		if(callbackError) callbackError(err)
		else callback(null);
	}

	if(localDebug) return fail("local debug mode");

	const req = Http.post(`http://${ip}:5000/api/getStopped`, JSON.stringify({ id: uuid }))
		.header('Content-Type', 'application/json')
		.header('Accept', '*/*');
	req.timeout = 10000;
	req.error(fail);
	req.submit((response) => {
		const temp = response.getResultAsString();
		if(!temp.length) return fail("reponse empty");
		const time = JSON.parse(temp).time;
		if(isNaN(Number(time))) return fail(`API IS BROKEN!!! Invalid unmark time "${time}": not a number`);
		if(time.toString().length > 13) callback(maxTime);
		callback(Number(time));
	});
}

let cachedIps:Record<string, boolean | undefined> = {};
/**Make an API request to see if an IP is likely VPN. */
export function isVpn(ip:string, callback: (isVpn:boolean) => unknown, callbackError?: (errorMessage:Throwable) => unknown){
	if(ip in cachedIps) return callback(cachedIps[ip]!);
	Http.get(`http://ip-api.com/json/${ip}?fields=proxy,hosting`, (res) => {
		const data = res.getResultAsString();
		const json = JSON.parse(data);
		const isVpn = json.proxy || json.hosting;
		cachedIps[ip] = isVpn;
		FishPlayer.stats.numIpsChecked ++;
		if(isVpn) FishPlayer.stats.numIpsFlagged ++;
		callback(isVpn);
	}, callbackError ?? ((err) => {
		Log.err(`[API] Network error when trying to call api.isVpn()`);
		FishPlayer.stats.numIpsErrored ++;
		callback(false);
	}));
}

/**Send text to the moderation logs channel in Discord. */
export function sendModerationMessage(message: string) {
	if(localDebug){
		Log.info(`Sent moderation log message: ${message}`);
		return;
	}
	const req = Http.post(`http://${ip}:5000/api/mod-dump`, JSON.stringify({ message })).header('Content-Type', 'application/json').header('Accept', '*/*');
	req.timeout = 10000;

	req.error(() => Log.err(`[API] Network error when trying to call api.sendModerationMessage()`));
	req.submit((response) => {
		//Log.info(response.getResultAsString());
	});
}

/**Get staff messages from discord. */
export function getStaffMessages(callback: (messages: string) => unknown) {
	if(localDebug) return;
	const server = getGamemode();
	const req = Http.post(`http://${ip}:5000/api/getStaffMessages`, JSON.stringify({ server }))
		.header('Content-Type', 'application/json').header('Accept', '*/*');
	req.timeout = 10000;
	req.error(() => Log.err(`[API] Network error when trying to call api.getStaffMessages()`));
	req.submit((response) => {
		const temp = response.getResultAsString();
		if(!temp.length) Log.err(`[API] Network error(empty response) when trying to call api.getStaffMessages()`);
		else callback(JSON.parse(temp).messages);
	});
}

/**Send staff messages from server. */
export function sendStaffMessage(message:string, playerName:string, callback?: (sent:boolean) => unknown){
	if(localDebug) return;
	const server = getGamemode();
	const req = Http.post(
		`http://${ip}:5000/api/sendStaffMessage`,
		// need to send both name variants so one can be sent to the other servers with color and discord can use the clean one
		JSON.stringify({ message, playerName, cleanedName: Strings.stripColors(playerName), server })
	).header('Content-Type', 'application/json').header('Accept', '*/*');
	req.timeout = 10000;
	req.error(() => {
		Log.err(`[API] Network error when trying to call api.sendStaffMessage()`);
		callback?.(false);
	});
	req.submit((response) => {
		const temp = response.getResultAsString();
		if(!temp.length) Log.err(`[API] Network error(empty response) when trying to call api.sendStaffMessage()`);
		else callback?.(JSON.parse(temp).data);
	});
}

/** Bans the provided ip and/or uuid. */
export function ban(data:{ip?:string; uuid?:string;}, callback:(status:string) => unknown = () => {}){
	if(localDebug) return;
	const req = Http.post(`http://${ip}:5000/api/ban`, JSON.stringify(data))
		.header('Content-Type', 'application/json')
		.header('Accept', '*/*');
	req.timeout = 10000;
	req.error(() => Log.err(`[API] Network error when trying to call api.ban(${data.ip}, ${data.uuid})`));
	req.submit((response) => {
		let str = response.getResultAsString();
		if(!str.length) return Log.err(`[API] Network error(empty response) when trying to call api.ban()`);
		callback(JSON.parse(str).data);
	});
}

/** Unbans the provided ip and/or uuid. */
export function unban(data:{ip?:string; uuid?:string;}, callback:(status:string, error?:string) => unknown = () => {}){
	if(localDebug) return;
	const req = Http.post(`http://${ip}:5000/api/unban`, JSON.stringify(data))
		.header('Content-Type', 'application/json')
		.header('Accept', '*/*');
	req.timeout = 10000;
	req.error(() => Log.err(`[API] Network error when trying to call api.ban({${data.ip}, ${data.uuid}})`));
	req.submit((response) => {
		let str = response.getResultAsString();
		if(!str.length) return Log.err(`[API] Network error(empty response) when trying to call api.unban()`);
		const parsedData = JSON.parse(str);
		callback(parsedData.status, parsedData.error);
	});
}

/** Gets if either the provided uuid or ip is banned. */
export function getBanned(data:{uuid?:string, ip?:string}, callback:(banned:boolean) => unknown){
	if(localDebug){
		Log.info(`[API] Attempted to getBanned(${data.uuid}/${data.ip}), assuming false due to local debug`);
		callback(false);
		return;
	}
	const req = Http.post(`http://${ip}:5000/api/checkIsBanned`, JSON.stringify(data))
		.header('Content-Type', 'application/json')
		.header('Accept', '*/*');
	req.timeout = 10000;
	req.error(() => Log.err(`[API] Network error when trying to call api.getBanned()`));
	req.submit((response) => {
		const str = response.getResultAsString();
		if(!str.length) return Log.err(`[API] Network error(empty response) when trying to call api.getBanned()`);
		callback(JSON.parse(str).data);
	});
}

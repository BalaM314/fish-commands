import { getGamemode, ip, localDebug } from './config';

/** Mark a player as stopped until time */
export function addStopped(uuid: string, time:number) {
	if(localDebug) return;
	const req = Http.post(`http://${ip}:5000/api/addStopped`, JSON.stringify({ id: uuid, time }))
		.header('Content-Type', 'application/json')
		.header('Accept', '*/*');
	req.timeout = 10000;

	try {
		req.submit((response, exception) => {
			//Log.info(response.getResultAsString());
			if (exception || !response) {
				Log.info('\n\nStopped API encountered an error while trying to add a stopped player.\n\n');
			}
		});
	} catch (e) {
		Log.info('\n\nStopped API encountered an error while trying to add a stopped player.\n\n');
	}
}

/** Mark a player as freed */
export function free(uuid: string) {
	if(localDebug) return;
	const req = Http.post(`http://${ip}:5000/api/free`, JSON.stringify({ id: uuid }))
		.header('Content-Type', 'application/json')
		.header('Accept', '*/*');
	req.timeout = 10000;

	try {
		req.submit((response, exception) => {
			//Log.info(response.getResultAsString());
			if (exception || !response) {
				Log.info('\n\nStopped API encountered an error while trying to free a stopped player.\n\n');
			}
		});
	} catch (e) {
		Log.info('\n\nStopped API encountered an error while trying to free a stopped player.\n\n');
	}
}

/** Gets player's unmark time */
export function getStopped(uuid: string, callback: (unmark:number) => unknown) {
	if(localDebug) return;
	const req = Http.post(`http://${ip}:5000/api/getStopped`, JSON.stringify({ id: uuid }))
		.header('Content-Type', 'application/json')
		.header('Accept', '*/*');
	req.timeout = 10000;

	try {
		req.submit((response, exception) => {
			if (exception || !response) {
				Log.info('\n\nStopped API encountered an error while trying to retrieve stopped players.\n\n');
			} else {
				const temp = response.getResultAsString();
				if(!temp.length) return false;
				const time = JSON.parse(temp).time;
				if(isNaN(Number(time))){
					Log.err(`API IS BROKEN!!! Invalid unmark time "${time}": not a number`);
				} else if(time.toString().length > 13){
					Log.err(`API IS BROKEN!!! Invalid unmark time "${time}": too long`);
				} else {
					callback(Number(time));
				}
			}
		});
	} catch (e) {
		Log.info('\n\nStopped API encountered an error while trying to retrieve stopped players.\n\n');
	}
}

let cachedIps:Record<string, boolean | undefined> = {};
/**Make an API request to see if an IP is likely VPN. */
export function isVpn(ip: string, callback: (isVpn: boolean) => unknown, callbackError?: (errorMessage: any) => unknown) {
	if(ip in cachedIps) callback(cachedIps[ip]!);
	try {
		Http.get(`http://ip-api.com/json/${ip}?fields=proxy,hosting`, (res) => {
			const data = res.getResultAsString();
			const json = JSON.parse(data);
			callback(cachedIps[ip] = json.proxy || json.hosting);
		});
	} catch (err) {
		callbackError?.(err);
	}
}

/**Send text to the moderation logs channel in Discord. */
export function sendModerationMessage(message: string) {
	if(localDebug) return;
	const req = Http.post(`http://${ip}:5000/api/mod-dump`, JSON.stringify({ message })).header('Content-Type', 'application/json').header('Accept', '*/*');
	req.timeout = 10000;

	try {
		req.submit((response, exception) => {
			if (exception || !response) {
				Log.info('\n\nError occured when trying to log moderation action.\n\n');
			}
		});
	} catch (e) {
		Log.info('\n\nError occured when trying to log moderation action.\n\n');
	}
}

/**Get staff messages from discord. */
export function getStaffMessages(callback: (messages: string) => unknown) {
	if(localDebug) return;
	const server = getGamemode();
	const req = Http.post(`http://${ip}:5000/api/getStaffMessages`, JSON.stringify({ server })).header('Content-Type', 'application/json').header('Accept', '*/*');
	req.timeout = 10000;

	try {
		req.submit((response, exception) => {
			if (exception || !response) {
				Log.info('\n\nError occured when trying to fetch staff chat.\n\n');
			} else {
				const temp = response.getResultAsString();
				if (!temp.length) return false;
				callback(JSON.parse(temp).messages);
			}
		});
	} catch (e) {
		Log.info('\n\nError occured when trying to fetch staff chat.\n\n');
	}
}

/**Send staff messages from server. */
export function sendStaffMessage(message: string, playerName: string, callback: (sent: boolean) => unknown = () => {}) {
	if(localDebug) return;
	const server = getGamemode();
	const req = Http.post(`http://${ip}:5000/api/sendStaffMessage`,
	// need to send both name variants so one can be sent to the other servers with color and discord can use the clean one
	JSON.stringify({ message, playerName, cleanedName: Strings.stripColors(playerName), server }))
	.header('Content-Type', 'application/json').header('Accept', '*/*');
	req.timeout = 10000;

	try {
		req.submit((response, exception) => {
			if (exception || !response) {
				Log.info('\n\nError occured when trying to send staff chat.\n\n');
			} else {
				const temp = response.getResultAsString();
				if (!temp.length) return false;
				callback(JSON.parse(temp).data);
			}
		});
	} catch (e) {
		Log.info('\n\nError occured when trying to send staff chat.\n\n');
	}
}

export function ban({ip, uuid}: {ip?:string; uuid?:string;}, callback:(status:string) => unknown = () => {}){
	if(localDebug) return;
	const req = Http.post(`http://${ip}:5000/api/ban`, JSON.stringify({ip, uuid}))
		.header('Content-Type', 'application/json')
		.header('Accept', '*/*');
	req.timeout = 10000;

	try {
		req.submit((response, exception) => {
			//Log.info(response.getResultAsString());
			if (exception || !response) {
				Log.info('\n\nStopped API encountered an error while trying to add a stopped player.\n\n');
			} else {
				let str = response.getResultAsString();
				if(str.length) callback(JSON.parse(str).data);
			}
		});
	} catch (e) {
		Log.info('\n\nStopped API encountered an error while trying to add a stopped player.\n\n');
	}
}

/** Gets player's unmark time */
export function getBanned({uuid, ip}:{uuid?:string, ip?:string}, callback:(banned:boolean) => unknown){
	if(localDebug) return;
	const req = Http.post(`http://${ip}:5000/api/checkIsBanned`, JSON.stringify({ ip, uuid }))
		.header('Content-Type', 'application/json')
		.header('Accept', '*/*');
	req.timeout = 10000;

	try {
		req.submit((response, exception) => {
			if (exception || !response) {
				Log.info('\n\nStopped API encountered an error while trying to retrieve stopped players.\n\n');
			} else {
				let temp = response.getResultAsString();
				if(temp.length) callback(JSON.parse(temp).data);
			}
		});
	} catch (e) {
		Log.info('\n\nStopped API encountered an error while trying to retrieve stopped players.\n\n');
	}
}
import { ip } from './config';

// Add a player's uuid to the stopped api
export function addStopped(uuid: string) {
	const req = Http.post(`http://${ip}:5000/api/addStopped`, JSON.stringify({ id: uuid }))
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

// Remove a player's uuid from the stopped api
export function free(uuid: string) {
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

// Check if player is stopped from API
export function getStopped(uuid: string, callback: (stopped: boolean) => unknown) {
	const req = Http.post(`http://${ip}:5000/api/getStopped`, JSON.stringify({ id: uuid }))
		.header('Content-Type', 'application/json')
		.header('Accept', '*/*');
	req.timeout = 10000;

	try {
		req.submit((response, exception) => {
			if (exception || !response) {
				Log.info('\n\nStopped API encountered an error while trying to retrieve stopped players.\n\n');
			} else {
				let temp = response.getResultAsString();
				if (!temp.length) return false;
				callback(JSON.parse(temp).data);
			}
		});
	} catch (e) {
		Log.info('\n\nStopped API encountered an error while trying to retrieve stopped players.\n\n');
	}
}

/**Make an API request to see if an IP is likely VPN. */
export function isVpn(ip: string, callback: (isVpn: boolean) => unknown, callbackError?: (errorMessage: any) => unknown) {
	try {
		Http.get(`http://ip-api.com/json/${ip}?fields=proxy,hosting`, (res) => {
			const data = res.getResultAsString();
			const json = JSON.parse(data);
			callback(json.proxy || json.hosting);
		});
	} catch (err) {
		callbackError?.(err);
	}
}

// Send info to moderation dump api/discord
export function logModerationAction(message: string) {
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

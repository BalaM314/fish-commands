import { Perm, commandList } from './commands';
import { FishPlayer } from './players';

//info tracker
let lastLabel = '';
let lastAccessedBulkLabel:FishPlayer | null = null;
let lastAccessedLabel:FishPlayer | null = null;
let lastAccessedBulkLine:FishPlayer | null = null;
let lastAccessedLine:FishPlayer | null = null;

const bulkLimit:number = 4096;

const noPermissionText:string = '[red]You don\'t have permission to use this packet.';
const invalidContentText:string = '[red]Invalid label content.';
const bulkSeparator:string = '|';
const procError:string = '[red]An error occured while processing your request.';
const invalidReq:string = '[red]Invalid request. Please consult the documentation.';

export function loadPacketHandlers() {
	//labels

	//fmt: "content,duration,x,y"
	Vars.netServer.addPacketHandler('label', (player:mindustryPlayer, content:string) => {
		try {
			const p:FishPlayer = FishPlayer.get(player);
			if (!p.hasPerm('play')) {
				player.sendMessage(noPermissionText);
				return;
			}

			lastAccessedLabel = p;
	
			handleLabel(player, content, true);
		} catch (e) {
			//TEMP FOR DEBUGGING: REMOVE L8R
			//Log.err(e as Error);

			player.sendMessage(procError);			
		}
	});

	Vars.netServer.addPacketHandler('bulkLabel', (player:mindustryPlayer, content:string) => {
		try {
			const p:FishPlayer = FishPlayer.get(player);
			if (!p.hasPerm('play') || !p.hasPerm('bulkLabelPacket')) {
				player.sendMessage(noPermissionText);
				return;
			}

			lastAccessedBulkLabel = p;

			//get individual labels
			const labels:string[] = [];
			let inQuotes:boolean = false;
			let startIdx:number = 0;

			for (let i = 0; i < content.length; i++) {
				switch (content[i]) {
					case '"':
						if (i > 0 && content[i-1] == '\\') break;
						inQuotes = !inQuotes;
						break;
					//separate
					case bulkSeparator:
						if (inQuotes) break;
						
						labels.push(content.substring(startIdx, i));
						startIdx = i + 1;
						break;
					default:
						break;
				}
			}
			
			//last label
			if (startIdx < content.length) {
				labels.push(content.substring(startIdx, content.length - 1));
			}

			//display labels
			for (let i = 0; i < labels.length; i++) {
				const label:string = labels[i];
				if (label.trim().length <= 0) continue;
				if (!handleLabel(player, label, false)) return;
			}
		} catch (e) {
			//TEMP FOR DEBUGGING: REMOVE L8R
			//Log.err(e as Error);

			player.sendMessage(procError);
		}
	});

	//lines
	Vars.netServer.addPacketHandler('lineEffect', (player:mindustryPlayer, content:string) => {
		try {
			const p:FishPlayer = FishPlayer.get(player);
			if (!p.hasPerm('play')) {
				player.sendMessage(noPermissionText);
				return;
			}

			if (!handleLine(content, player)) return;
			lastAccessedLine = p;
		} catch (e) {
			//TEMP FOR DEBUGGING: REMOVE L8R
			//Log.err(e as Error);

			player.sendMessage(procError);
		}
	});

	//this is the silas effect but it's way too real
	Vars.netServer.addPacketHandler('bulkLineEffect', (player:mindustryPlayer, content:string) => {
		try {
			const p:FishPlayer = FishPlayer.get(player);
			if (!p.hasPerm('play') || !p.hasPerm('bulkLabelPacket')) {
				player.sendMessage(noPermissionText);
				return;
			}

			const lines:string[] = content.split(bulkSeparator);

			for (let i = 0; i < lines.length; i++) {
				const line:string = lines[i];
				if (line.trim().length <= 0) continue;
				if (!handleLine(line, player)) return;
			}

			lastAccessedBulkLine = p;
		} catch (e) {
			//TEMP FOR DEBUGGING: REMOVE L8R
			//Log.err(e as Error);

			player.sendMessage(procError);
		}
	});
}

//commands
export const commands = commandList({
	pklast: {
		args: [],
		description: 'Tells you who last accessed the packet handlers.',
		perm: Perm.mod,
		handler({output}) {
			const outputLines:string[] = [];

			if (lastAccessedLabel && lastLabel) {
				outputLines.push(`${lastAccessedLabel.name} created label "${lastLabel}".`);
			}
			if (lastAccessedBulkLabel) {
				outputLines.push(`${lastAccessedBulkLabel.name} last used the bulk label effect.`);
			}
			if (lastAccessedLine) {
				outputLines.push(`${lastAccessedLine.name} last used the line effect.`);
			}
			if (lastAccessedBulkLine) {
				outputLines.push(`${lastAccessedBulkLine.name} last used the bulk line effect.`);
			}

			output(outputLines.length > 0 ? outputLines.join('\n') : 'No packet handlers have been accessed yet.');
		}
	},
	pkdocs: {
		description: 'Packet handler documentation.',
		args: [],
		perm: Perm.none,
		handler({sender, output}) {
			const responseLines:string[] = [];
			const canBulk:boolean = sender.hasPerm('bulkLabelPacket');
			
			responseLines.push('Line effect: "lineEffect", "x0,y0,x1,y1,hexColor" (for example "20.7,19.3,50.4,28.9,#FF0000")\n');
			if (canBulk) responseLines.push('Bulk line effect: "bulkLineEffect", equivalent to multiple lineEffect packets, with every line separated by a \'|\' symbol.\n');
			responseLines.push('Label effect: "label", "content,duration,x,y" (for example ""Hi!",10,20,28")\n');
			if (canBulk) responseLines.push('Bulk label effect: "bulkLabel", equivalent to multiple label packets, with every label separated by a \'|\' symbol.\n');
			
			responseLines.push('Use "Call.serverPacketReliable" to send these.');
			responseLines.push('You need to multiply world coordinates by Vars.tilesize (8) for things to work properly. This is a relic from the v3 days where every tile was 8 pixels.');
			responseLines.push('Keep in mind there\'s a packet spam limit. Use at your own risk.');

			responseLines.push(''); //empty line

			//credit
			responseLines.push('These packet handlers and everything related to them were made by [green]frog[white].');
			responseLines.push('"The code style when submitted was beyond drunk... but it worked... barely"\n    -BalaM314');
			responseLines.push('"worst error handling i have ever seen, why kick the player???"\n    -ASimpleBeginner');
			responseLines.push('Most of the code was rewritten in 2024 by [#6e00fb]D[#9e15de]a[#cd29c2]r[#fd3ea5]t[white].');

			//bulkInfoMsg(responseLines, sender.player.con as NetConnection);
			output(responseLines.join('\n'));
		}
	}
});

//#region utils

function findEndQuote(content:string, startPos:number) {
	if (content[startPos] != '"') {
		//not a start quote??
		return -1;
	}

	for (let i = startPos + 1; i < content.length; i++) {
		if (content[i] == '"' && (i < 1 || content[i-1] != '\\')) {
			return i;
		}
	}

	return -1;
}

function handleLabel(player:mindustryPlayer, content:string, isSingle:boolean):boolean {
	const endPos:number = findEndQuote(content, 0);
	if (endPos == -1) {
		//invalid content
		player.sendMessage(invalidContentText);
		return false;
	}

	//label, clean up \"s
	const message:string = content.substring(1, endPos).replace('\\"', '"');
	const parts:string[] = content.substring(endPos + 2).split(',');

	if (parts.length != 3) { //dur,x,y
		player.sendMessage(invalidReq);
		return false;
	}

	if (isSingle) {
		lastLabel = message;
	}

	Call.labelReliable(
		message,          //message
		Number(parts[0]), //duration
		Number(parts[1]), //x
		Number(parts[2])  //y
	);
	return true;
}

function handleLine(content:string, player:mindustryPlayer):boolean {
	const parts:string[] = content.split(',');

	if (parts.length != 5) { //x0,y0,x1,y1,color
		player.sendMessage(invalidReq);
		return false;
	}

	Tmp.v1.set(Number(parts[2]), Number(parts[3])); //x1,y1
	Color.valueOf(Tmp.c1, parts[4]); //color

	Call.effect(
		Fx.pointBeam,
		Number(parts[0]), Number(parts[1]), //x,y
		0, Tmp.c1,                          //color
		Tmp.v1                              //x1,y1
	);
	return true;
}

function bulkInfoMsg(messages:string[], conn:NetConnection) {
	for (let i = messages.length - 1; i >= 0; i--) {
		Call.infoMessage(conn, messages[i]);
	}
}

//#endregion
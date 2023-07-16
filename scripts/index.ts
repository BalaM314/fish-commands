/**
 * This used to be main.js but was renamed to index.js due to rhino issue
 */

import * as api from './api';
import * as commands from './commands';
import * as consoleCommands from "./consoleCommands";
import { fishState, tileHistory } from "./globals";
import * as memberCommands from './memberCommands';
import * as menus from "./menus";
import { Ohnos } from "./ohno";
import * as playerCommands from './playerCommands';
import { FishPlayer } from './players';
import * as staffCommands from './staffCommands';
import * as timers from './timers';
import { StringIO, formatTimeRelative, matchFilter, serverRestartLoop } from "./utils";




Events.on(EventType.PlayerJoin, (e) => {
	FishPlayer.onPlayerJoin(e.player);
});
Events.on(EventType.ConnectPacketEvent, (e) => {
	api.getBanned({
		ip: e.connection.address,
		uuid: e.packet.uuid
	}, (banned) => {
		if(banned){
			Log.info(`&lrSynced ban of ${e.packet.uuid}/${e.connection.address}.`);
			e.connection.kick(Packets.KickReason.banned);
			Vars.netServer.admins.banPlayerIP(e.connection.address);
			Vars.netServer.admins.banPlayerID(e.packet.uuid);
		}
	});
});
Events.on(EventType.UnitChangeEvent, (e) => {
	FishPlayer.onUnitChange(e.player, e.unit);
});
Events.on(EventType.ContentInitEvent, () => {
	//Unhide latum and renale
	UnitTypes.latum.hidden = false;
	UnitTypes.renale.hidden = false;
});

Events.on(EventType.ServerLoadEvent, (e) => {
	const ActionType = Packages.mindustry.net.Administration.ActionType;
	const clientHandler = Vars.netServer.clientCommands;
	const serverHandler = Core.app.listeners.find(
		(l) => l instanceof Packages.mindustry.server.ServerControl
	).handler;

	FishPlayer.loadAll();
	timers.initializeTimers();
	menus.registerListeners();

	// Mute muted players
	Vars.netServer.admins.addChatFilter((player:mindustryPlayer, text:string) => {
		const fishPlayer = FishPlayer.get(player);

		if(matchFilter(text) && !fishPlayer.hasPerm("bypassChatFilter")){
			Log.info(`Censored message from player ${player.name}: ${text}`);
			text = `[#f456f]I really hope everyone is having a fun time :) <3`;
		}

		if(text.startsWith("./")) text = text.replace("./", "/");

		if(!fishPlayer.hasPerm("chat")){
			FishPlayer.messageMuted(player.name, text);
			Log.info(`<muted>${player.name}: ${text}`);
			return null;
		}


		if(fishPlayer.highlight){
			return fishPlayer.highlight + text;
		}

		return text;

	});

	// Action filters
	Vars.netServer.admins.addActionFilter((action:PlayerAction) => {
		const player = action.player;
		const fishP = FishPlayer.get(player);

		//prevent stopped players from doing anything other than deposit items.
		if(!fishP.hasPerm("play")){
			action.player.sendMessage('[scarlet]⚠ [yellow]You are stopped, you cant perfom this action.');
			return false;
		} else {
			if(action.type === ActionType.rotate){
				addToTileHistory({
					pos: `${action.tile.x},${action.tile.y}`,
					name: action.player.name,
					action: "rotated",
					type: action.tile.block()?.name ?? "nothing",
				});
			}
			return true;
		}
	});


	commands.register(staffCommands.commands, clientHandler, serverHandler);
	commands.register(playerCommands.commands, clientHandler, serverHandler);
	commands.register(memberCommands.commands, clientHandler, serverHandler);
	//commands.register(packetHandlers.commands, clientHandler, serverHandler);
	commands.registerConsole(consoleCommands.commands, serverHandler);
	//packetHandlers.loadPacketHandlers();
	// stored for limiting /reset frequency
	Core.settings.remove('lastRestart');

	//const getIp = Http.get('https://api.ipify.org?format=js');
	//getIp.submit((r) => {
	//	//serverIp = r.getResultAsString();
	//});
});

/**
 * Keeps track of any action performed on a tile for use in /tilelog
 * command.
 */

function addToTileHistory(e:any){

	let tile:Tile, uuid:string, action:string, type:string, time:number = Date.now();
	if(e instanceof EventType.BlockBuildBeginEvent){
		tile = e.tile;
		uuid = e.unit?.player?.uuid() ?? e.unit?.type.name ?? "unknown";
		if(e.breaking){
			action = "broke";
			type = (e.tile.build instanceof ConstructBlock.ConstructBuild) ? e.tile.build.previous.name : "unknown";
		} else {
			action = "built";
			type = (e.tile.build instanceof ConstructBlock.ConstructBuild) ? e.tile.build.current.name : "unknown";
		}
	} else if(e instanceof EventType.ConfigEvent){
		tile = e.tile.tile;
		uuid = e.player?.uuid() ?? "unknown";
		action = "configured";
		type = e.tile.block.name;
	} else if(e instanceof EventType.BuildRotateEvent){
		tile = e.build.tile;
		uuid = e.unit?.player?.uuid() ?? e.unit?.type.name ?? "unknown";
		action = "rotated";
		type = e.build.block.name;
	} else if(e instanceof Object && "pos" in e && "uuid" in e && "action" in e && "type" in e){
		let pos;
		({pos, uuid, action, type} = e);
		tile = Vars.world.tile(pos.split(",")[0], pos.split(",")[1]);
	} else return;

	tile.getLinkedTiles((t:Tile) => {
		const pos = `${t.x},${t.y}`;
		let existingData = tileHistory[pos] ? StringIO.read(tileHistory[pos], str => str.readArray(d => ({
			action: d.readString(2),
			uuid: d.readString(2),
			time: d.readNumber(16),
			type: d.readString(2),
		}), 1)) : [];
	
		existingData.push({
			action, uuid, time, type
		});
		if(existingData.length >= 9){
			existingData = existingData.splice(0, 9);
		}
		//Write
		tileHistory[t.x + ',' + t.y] = StringIO.write(existingData, (str, data) => str.writeArray(data, el => {
			str.writeString(el.action, 2);
			str.writeString(el.uuid, 2);
			str.writeNumber(el.time, 16);
			str.writeString(el.type, 2);
		}, 1));
	});
	
};

Events.on(EventType.BlockBuildBeginEvent, addToTileHistory);
Events.on(EventType.BuildRotateEvent, addToTileHistory);
Events.on(EventType.ConfigEvent, addToTileHistory);

Events.on(EventType.TapEvent, (e) => {
	const fishP = FishPlayer.get(e.player);
	if(fishP.tileId){
		e.player.sendMessage(e.tile.block().id);
		fishP.tileId = false;
	} else if(fishP.tilelog){
		const tile = e.tile;
		const pos = tile.x + ',' + tile.y;
		if(!tileHistory[pos]){
			fishP.sendMessage(
				`[yellow]There is no recorded history for the selected tile (${tile.x}, ${tile.y}).`
			);
		} else {
			const history = StringIO.read(tileHistory[pos]!, str => str.readArray(d => ({
				action: d.readString(2),
				uuid: d.readString(2)!,
				time: d.readNumber(16),
				type: d.readString(2),
			}), 1));
			fishP.sendMessage(history.map(e =>
				fishP.hasPerm("viewUUIDs")
				? `[yellow]${Vars.netServer.admins.getInfoOptional(e.uuid)?.plainLastName()}[lightgray](${e.uuid})[] ${e.action} a [cyan]${e.type}[] ${formatTimeRelative(e.time)}`
				: `[yellow]${Vars.netServer.admins.getInfoOptional(e.uuid)?.plainLastName()} ${e.action} a [cyan]${e.type}[] ${formatTimeRelative(e.time)}`
			).join('\n'));
		}
		if(fishP.tilelog === "once") fishP.tilelog = null;
	}
});

Events.on(EventType.GameOverEvent, (e) => {
	Ohnos.onGameOver();
	for(const [key, value] of Object.entries(tileHistory)){
		tileHistory[key] = null!;
		delete tileHistory[key];
	}
	if(fishState.restarting){
		Call.sendMessage(`[accent]---[[[coral]+++[]]---\n[accent]Server restart imminent. [green]We'll be back after 15 seconds.[]\n[accent]---[[[coral]+++[]]---`);
		serverRestartLoop(10);
	}
});

Events.on(EventType.DisposeEvent, (e) => {
	FishPlayer.saveAll();
});

Events.on(EventType.PlayerConnectionConfirmed, (e) => {
	const info = e.player.getInfo();
	if(info.timesJoined == 1){
		Log.info(`&lrNew player joined: name &c${e.player.name}&lr, uuid &c${e.player.uuid()}&lr, ip &c${e.player.ip()}&lr`);
	}
});

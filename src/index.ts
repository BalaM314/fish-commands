/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the main code, which calls other functions and initializes the plugin.
*/

import * as api from './api';
import * as commands from './commands';
import { handleTapEvent } from './commands';
import { commands as consoleCommands } from "./consoleCommands";
import { fishPlugin, fishState, ipJoins, tileHistory } from "./globals";
import { commands as memberCommands } from './memberCommands';
import * as menus from "./menus";
import { loadPacketHandlers, commands as packetHandlerCommands } from './packetHandlers';
import { commands as playerCommands } from './playerCommands';
import { FishPlayer } from './players';
import { commands as staffCommands } from './staffCommands';
import * as timers from './timers';
import { addToTileHistory, fishCommandsRootDirPath, processChat, serverRestartLoop } from "./utils";


Events.on(EventType.ConnectionEvent, (e) => {
	if(Vars.netServer.admins.isIPBanned(e.connection.address)){
		api.getBanned({
			ip: e.connection.address,
		}, (banned) => {
			if(!banned){
				//If they were previously banned locally, but the API says they aren't banned, then unban them and clear the kick that the outer function already did
				Vars.netServer.admins.unbanPlayerIP(e.connection.address);
				Vars.netServer.admins.kickedIPs.remove(e.connection.address);
			}
		});
	}
});
Events.on(EventType.PlayerConnect, (e) => {
	if(FishPlayer.shouldKickNewPlayers() && e.player.info.timesJoined == 1){
		e.player.kick(Packets.KickReason.kick, 3600000);
	}
	FishPlayer.onPlayerConnect(e.player);
});
Events.on(EventType.PlayerJoin, (e) => {
	FishPlayer.onPlayerJoin(e.player);
});
Events.on(EventType.PlayerLeave, (e) => {
	FishPlayer.onPlayerLeave(e.player);
});
Events.on(EventType.ConnectPacketEvent, (e) => {
	FishPlayer.playersJoinedRecent ++;
	ipJoins.increment(e.connection.address);
	const info = Vars.netServer.admins.getInfoOptional(e.packet.uuid);
	const underAttack = FishPlayer.antiBotMode();
	const newPlayer = !info || info.timesJoined < 10;
	const longModName = e.packet.mods.contains((str:string) => str.length > 50);
	const veryLongModName = e.packet.mods.contains((str:string) => str.length > 100);
	if(
		(underAttack && e.packet.mods.size > 2) ||
		(underAttack && longModName) ||
		(veryLongModName && (underAttack || newPlayer))
	){
		Vars.netServer.admins.blacklistDos(e.connection.address);
		e.connection.kicked = true;
		FishPlayer.onBotWhack();
		Log.info(`&yAntibot killed connection ${e.connection.address} because ${veryLongModName ? "very long mod name" : longModName ? "long mod name" : "it had mods while under attack"}`);
		return;
	}
	if(ipJoins.get(e.connection.address) >= ( (underAttack || veryLongModName) ? 3 : (newPlayer || longModName) ? 7 : 15 )){
		Vars.netServer.admins.blacklistDos(e.connection.address);
		e.connection.kicked = true;
		FishPlayer.onBotWhack();
		Log.info(`&yAntibot killed connection ${e.connection.address} due to too many connections`);
		return;
	}
	/*if(e.packet.name.includes("discord.gg/GnEdS9TdV6")){
		Vars.netServer.admins.blacklistDos(e.connection.address);
		e.connection.kicked = true;
		FishPlayer.onBotWhack();
		Log.info(`&yAntibot killed connection ${e.connection.address} due to omni discord link`);
		return;
	}
	if(e.packet.name.includes("счастливого 2024 года!")){
		Vars.netServer.admins.blacklistDos(e.connection.address);
		e.connection.kicked = true;
		FishPlayer.onBotWhack();
		Log.info(`&yAntibot killed connection ${e.connection.address} due to known bad name`);
		return;
	}*/
	if(Vars.netServer.admins.isDosBlacklisted(e.connection.address)){
		//threading moment, i think
		e.connection.kicked = true;
		return;
	}
	api.getBanned({
		ip: e.connection.address,
		uuid: e.packet.uuid
	}, (banned) => {
		if(banned){
			Log.info(`&lrSynced ban of ${e.packet.uuid}/${e.connection.address}.`);
			e.connection.kick(Packets.KickReason.banned, 1);
			Vars.netServer.admins.banPlayerIP(e.connection.address);
			Vars.netServer.admins.banPlayerID(e.packet.uuid);
		} else {
			Vars.netServer.admins.unbanPlayerIP(e.connection.address);
			Vars.netServer.admins.unbanPlayerID(e.packet.uuid);
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
Events.on(EventType.PlayerChatEvent, (e) => processChat(e.player, e.message, true));

Events.on(EventType.ServerLoadEvent, (e) => {
	const clientHandler = Vars.netServer.clientCommands;
	const serverHandler = ServerControl.instance.handler;

	FishPlayer.loadAll();
	timers.initializeTimers();
	menus.registerListeners();

	//Cap delta
	Time.setDeltaProvider(() => Math.min(Core.graphics.getDeltaTime() * 60, 10));

	// Mute muted players
	Vars.netServer.admins.addChatFilter((player, message) => processChat(player, message));

	// Action filters
	Vars.netServer.admins.addActionFilter((action:PlayerAction) => {
		const player = action.player;
		const fishP = FishPlayer.get(player);

		//prevent stopped players from doing anything other than deposit items.
		if(!fishP.hasPerm("play")){
			action.player.sendMessage('[scarlet]\u26A0 [yellow]You are stopped, you cant perfom this action.');
			return false;
		} else {
			if(action.type === Administration.ActionType.pickupBlock){
				addToTileHistory({
					pos: `${action.tile!.x},${action.tile!.y}`,
					uuid: action.player.uuid(),
					action: "picked up",
					type: action.tile!.block()?.name ?? "nothing",
				});
			}
			return true;
		}
	});


	commands.register(staffCommands, clientHandler, serverHandler);
	commands.register(playerCommands, clientHandler, serverHandler);
	commands.register(memberCommands, clientHandler, serverHandler);
	commands.register(packetHandlerCommands, clientHandler, serverHandler);
	commands.registerConsole(consoleCommands, serverHandler);
	loadPacketHandlers();
	
	commands.initialize();

	//Load plugin data
	try {
		const path = fishCommandsRootDirPath();
		fishPlugin.directory = path.toString();
		Threads.daemon(() => {
			try {
				fishPlugin.version = OS.exec("git", "-C", fishPlugin.directory!, "rev-parse", "HEAD");
			} catch {}
		});
	} catch(err){
		Log.err("Failed to get fish plugin information.");
		Log.err(err);
	}

});

// Keeps track of any action performed on a tile for use in tilelog.

Events.on(EventType.BlockBuildBeginEvent, addToTileHistory);
Events.on(EventType.BuildRotateEvent, addToTileHistory);
Events.on(EventType.ConfigEvent, addToTileHistory);
Events.on(EventType.PickupEvent, addToTileHistory);
Events.on(EventType.PayloadDropEvent, addToTileHistory);
Events.on(EventType.UnitDestroyEvent, addToTileHistory);
Events.on(EventType.BlockDestroyEvent, addToTileHistory);


Events.on(EventType.TapEvent, handleTapEvent);

Events.on(EventType.GameOverEvent, (e) => {
	for(const key of Object.keys(tileHistory)){
		//clear tilelog
		tileHistory[key] = null!;
		delete tileHistory[key];
	}
	if(fishState.restartQueued){
		//restart
		Call.sendMessage(`[accent]---[[[coral]+++[]]---\n[accent]Server restart imminent. [green]We'll be back after 15 seconds.[]\n[accent]---[[[coral]+++[]]---`);
		serverRestartLoop(20);
	}
	FishPlayer.onGameOver(e.winner as Team);
});
Events.on(EventType.PlayerChatEvent, e => {
	FishPlayer.onPlayerChat(e.player, e.message);
});
Events.on(EventType.DisposeEvent, (e) => { //TODO does not actually work...
	FishPlayer.saveAll();
});


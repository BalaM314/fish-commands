/**
 * This used to be main.js but was renamed to index.js due to rhino issue
 */

import * as api from './api';
import * as commands from './commands';
import { handleTapEvent } from './commands';
import { Mode } from './config';
import * as consoleCommands from "./consoleCommands";
import { fishState, ipJoins, tileHistory } from "./globals";
import * as memberCommands from './memberCommands';
import * as menus from "./menus";
import * as packetHandlers from './packetHandlers';
import * as playerCommands from './playerCommands';
import { FishPlayer } from './players';
import * as staffCommands from './staffCommands';
import * as timers from './timers';
import { StringIO, crash, logErrors, processChat, serverRestartLoop } from "./utils";


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
	if(ipJoins.get(e.connection.address) >= ( underAttack ? 3 : newPlayer ? 7 : 15 )){
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


	commands.register(staffCommands.commands, clientHandler, serverHandler);
	commands.register(playerCommands.commands, clientHandler, serverHandler);
	commands.register(memberCommands.commands, clientHandler, serverHandler);
	commands.register(packetHandlers.commands, clientHandler, serverHandler);
	commands.registerConsole(consoleCommands.commands, serverHandler);
	packetHandlers.loadPacketHandlers();
	
	commands.initialize();

});

/**Keeps track of any action performed on a tile for use in tilelog. */

const addToTileHistory = logErrors("Error while saving a tilelog entry", (e:any) => {

	let tile:Tile, uuid:string, action:string, type:string, time:number = Date.now();
	if(e instanceof EventType.BlockBuildBeginEvent){
		tile = e.tile;
		uuid = e.unit?.player?.uuid() ?? e.unit?.type.name ?? "unknown";
		if(e.breaking){
			action = "broke";
			type = (e.tile.build instanceof ConstructBlock.ConstructBuild) ? e.tile.build.previous.name : "unknown";
			if(e.unit?.player?.uuid() && e.tile.build?.team != Team.derelict){
				const fishP = FishPlayer.get(e.unit.player);
				//TODO move this code
				fishP.tstats.blocksBroken ++;
				fishP.stats.blocksBroken ++;
			}
		} else {
			action = "built";
			type = (e.tile.build instanceof ConstructBlock.ConstructBuild) ? e.tile.build.current.name : "unknown";
			if(e.unit?.player?.uuid()){
				const fishP = FishPlayer.get(e.unit.player);
				//TODO move this code
				fishP.stats.blocksPlaced ++;
			}
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
	} else if(e instanceof EventType.UnitDestroyEvent){
		tile = e.unit.tileOn();
		if(!tile) return;
		uuid = e.unit.isPlayer() ? e.unit.getPlayer().uuid() : e.unit.lastCommanded ?? "unknown";
		action = "killed";
		type = e.unit.type.name;
	} else if(e instanceof EventType.BlockDestroyEvent){
		if(Mode.attack() && e.tile.build?.team != Vars.state.rules.defaultTeam) return; //Don't log destruction of enemy blocks
		tile = e.tile;
		uuid = "[[something]";
		action = "killed";
		type = e.tile.block()?.name ?? "air";
	} else if(e instanceof EventType.PayloadDropEvent){
		action = "pay-dropped";
		const controller = e.carrier.controller();
		uuid = e.carrier.player?.uuid() ?? (controller instanceof LogicAI ? `${e.carrier.type.name} controlled by ${controller.controller.block.name} at ${controller.controller.tileX()},${controller.controller.tileY()} last accessed by ${e.carrier.getControllerName()}` : null) ?? e.carrier.type.name;
		if(e.build){
			tile = e.build.tile;
			type = e.build.block.name;
		} else if(e.unit){
			tile = e.unit.tileOn();
			if(!tile) return;
			type = e.unit.type.name;
		} else return;
	} else if(e instanceof EventType.PickupEvent){
		action = "picked up";
		if(e.carrier.isPlayer()) return; //This event would have been handled by actionfilter
		const controller = e.carrier.controller();
		if(!(controller instanceof LogicAI)) return;
		uuid = `${e.carrier.type.name} controlled by ${controller.controller.block.name} at ${controller.controller.tileX()},${controller.controller.tileY()} last accessed by ${e.carrier.getControllerName()}`
		if(e.build){
			tile = e.build.tile;
			type = e.build.block.name;
		} else if(e.unit){
			tile = e.unit.tileOn();
			if(!tile) return;
			type = e.unit.type.name;
		} else return;
	} else if(e instanceof Object && "pos" in e && "uuid" in e && "action" in e && "type" in e){
		let pos;
		({pos, uuid, action, type} = e);
		tile = Vars.world.tile(pos.split(",")[0], pos.split(",")[1]) ?? crash(`Cannot log ${action} at ${pos}: Nonexistent tile`);
	} else return;
	if(tile == null) return;
	[tile, uuid, action, type, time] satisfies [Tile, string, string, string, number];

	tile.getLinkedTiles((t:Tile) => {
		const pos = `${t.x},${t.y}`;
		let existingData = tileHistory[pos] ? StringIO.read(tileHistory[pos], str => str.readArray(d => ({
			action: d.readString(2),
			uuid: d.readString(3),
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
			str.writeString(el.uuid, 3);
			str.writeNumber(el.time, 16);
			str.writeString(el.type, 2);
		}, 1));
	});
	
});

Events.on(EventType.BlockBuildBeginEvent, addToTileHistory);
Events.on(EventType.BuildRotateEvent, addToTileHistory);
Events.on(EventType.ConfigEvent, addToTileHistory);
Events.on(EventType.PickupEvent, addToTileHistory);
Events.on(EventType.PayloadDropEvent, addToTileHistory);
Events.on(EventType.UnitDestroyEvent, addToTileHistory);
Events.on(EventType.BlockDestroyEvent, addToTileHistory);


Events.on(EventType.TapEvent, handleTapEvent);

Events.on(EventType.GameOverEvent, (e) => {
	for(const [key, value] of Object.entries(tileHistory)){
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


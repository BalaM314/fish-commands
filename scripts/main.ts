importPackage(Packages.arc);
importPackage(Packages.mindustry.type);

import { getTimeSinceText } from "./utils";
import { FishPlayer } from './players';
import * as timers from './timers';
import * as config from './config';
import * as commands from './commands';
import * as staffCommands from './staffCommands';
import * as playerCommands from './playerCommands';
import * as memberCommands from './memberCommands';

let serverCommands;
let serverIp;
interface TileHistoryEntry {
  name:string;
  action:string;
  type:string;
  time:number;
}
let tileHistory:Record<string, TileHistoryEntry[]> = {};

Events.on(EventType.PlayerJoin, (e) => {
  FishPlayer.onPlayerJoin(e.player);
});

Events.on(ServerLoadEvent, (e) => {
  const ActionType = Packages.mindustry.net.Administration.ActionType;
  const clientCommands = Vars.netServer.clientCommands;
  serverCommands = Core.app.listeners.find(
    (l) => l instanceof Packages.mindustry.server.ServerControl
  ).handler;

  FishPlayer.loadAll();

  // Mute muted players
  Vars.netServer.admins.addChatFilter((player:mindustryPlayer, text:string) => {
    const fishPlayer = FishPlayer.get(player);

    if (fishPlayer.muted) {
      player.sendMessage('[scarlet]⚠ [yellow]You are muted.');
      return null;
    }

    if (fishPlayer.highlight) {
      return fishPlayer.highlight + text;
    }

    return config.bannedWords.some((bw) => text.includes(bw))
      ? '[#f456f]I really hope everyone is having a fun time :) <3'
      : text;
  });

  // Action filters
  Vars.netServer.admins.addActionFilter((action:PlayerAction) => {
    const player = action.player;
    const fishP = FishPlayer.get(player);

    //prevent stopped players from doing anything other than deposit items.
    if (fishP.stopped) {
      if (action.type == ActionType.depositItem) {
        return true;
      } else {
        action.player.sendMessage('[scarlet]⚠ [yellow]You are stopped, you cant perfom this action.');
        return false;
      }
    } else {
      if (action.type === ActionType.rotate) {
        addToTileHistory({
          unit: player.unit(),
          tile: action.tile,
          player: player,
          breaking: null,
        }, 'rotate');
      }
      return true;
    }

    
  });


  timers.initializeTimers();
  

  const runner = (method:any) => new Packages.arc.util.CommandHandler.CommandRunner({ accept: method });
  //TODO Is this necessary? Can this function be moved to register()?

  clientCommands.removeCommand('help');
  // clientCommands.removeCommand('votekick');
  // clientCommands.removeCommand('vote');

  commands.register(staffCommands.commands, clientCommands, serverCommands, runner);
  commands.register(playerCommands.commands, clientCommands, serverCommands, runner);
  commands.register(memberCommands.commands, clientCommands, serverCommands, runner);

  // stored for limiting /reset frequency
  Core.settings.remove('lastRestart');

  const getIp = Http.get('https://api.ipify.org?format=js');
  getIp.submit((r) => {
    serverIp = r.getResultAsString();
  });
});

/**
 * Keeps track of any action performed on a tile for use in /tilelog
 * command.
 */
function addToTileHistory(e:any, eventType:"build" | "rotate"){
  const unit = e.unit;
  if (!unit.player) return;
  const tile = e.tile;
  const realP = e.unit.player;
  const pos = tile.x + ',' + tile.y;
  const destroy = e.breaking;
  
  tileHistory[pos] ??= [];
  if (eventType === 'build') {
    tileHistory[pos].push({
      name: realP.name,
      action: destroy ? 'broke' : 'built',
      type: destroy ? 'tile' : tile.block(),
      time: Date.now(),
    });
  }

  if (eventType === 'rotate') {
    tileHistory[pos].push({
      name: realP.name,
      action: 'rotated',
      type: 'block',
      time: Date.now(),
    });
  }

  if (tileHistory[pos].length >= 3) {
    tileHistory[pos].shift();
  }
  return;
};

Events.on(EventType.BlockBuildBeginEvent, (e) => {
  addToTileHistory(e, 'build');
});

Events.on(EventType.TapEvent, (e) => {
  const fishP = FishPlayer.get(e.player);
  if (fishP.tileId) {
    e.player.sendMessage(e.tile.block().id);
    fishP.tileId = false;
  } else if(fishP.tilelog){
    const realP = e.player;
    const tile = e.tile;
    const pos = tile.x + ',' + tile.y;
    if(!tileHistory[pos]){
      realP.sendMessage(
        `[yellow]There is no recorded history for the selected tile (${tile.x}, ${tile.y}).`
      );
      fishP.tilelog = false;
    } else {
      realP.sendMessage(tileHistory[pos].map(e => 
        e.name + `[yellow] ` + e.action + ' a block ' + getTimeSinceText(e.time)
      ).join('\n'));
    }
    fishP.tilelog = false;
  }

});

importPackage(Packages.arc);
importPackage(Packages.mindustry.type);

const utils = require('utils');
const { FishPlayer } = require('players');
const timers = require('timers');
const trails = require('trails');
const config = require('config');
const ohno = require('ohno');
const commands = require('commands');
const staffCommands = require('staffCommands');
const playerCommands = require('playerCommands');
const whisper = require('whisper');
const memberCommands = require('memberCommands');

let serverCommands;
let serverIp;
let tileHistory = {};

Events.on(PlayerJoin, (e) => {
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
  Vars.netServer.admins.addChatFilter((player, text) => {
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
  Vars.netServer.admins.addActionFilter((action) => {
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
  

  const runner = (method) => new Packages.arc.util.CommandHandler.CommandRunner({ accept: method });
  //Is this necessary? Can this function be moved to register()?

  clientCommands.removeCommand('help');
  // clientCommands.removeCommand('votekick');
  // clientCommands.removeCommand('vote');

  commands.register(staffCommands.commands, clientCommands, serverCommands, runner);
  commands.register(playerCommands.commands, clientCommands, serverCommands, runner);
  ohno.registerCommands(clientCommands, runner);
  whisper.registerCommands(clientCommands, runner);
  trails.registerCommands(clientCommands, runner);
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
const addToTileHistory = (e, eventType) => {
  const unit = e.unit;
  if (!unit.player) return;
  const tile = e.tile;
  const realP = e.unit.player;
  const pos = tile.x + ',' + tile.y;
  const destroy = e.breaking;

  if (eventType === 'build') {
    if (!tileHistory[pos]) {
      tileHistory[pos] = [
        {
          name: realP.name,
          action: destroy ? 'broke' : 'built',
          type: destroy ? 'tile' : tile.block(),
          time: Date.now(),
        },
      ];
      return;
    }

    tileHistory[pos].push({
      name: realP.name,
      action: destroy ? 'broke' : 'built',
      type: destroy ? 'tile' : tile.block(),
      time: Date.now(),
    });
  }

  if (eventType === 'rotate') {
    if (!tileHistory[pos]) {
      tileHistory[pos] = [
        {
          name: realP.name,
          action: 'rotated',
          type: 'block',
          time: Date.now(),
        },
      ];
      return;
    }

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

Events.on(BlockBuildBeginEvent, (e) => {
  addToTileHistory(e, 'build');
});

Events.on(TapEvent, (e) => {
  const p = FishPlayer.get(e.player);
  if (p.tileId) {
    e.player.sendMessage(e.tile.block().id);
    p.tileId = false;
  }
  if (!p.tilelog) return;
  const realP = e.player;
  const tile = e.tile;
  const pos = tile.x + ',' + tile.y;
  if (!tileHistory[pos]) {
    realP.sendMessage(
      `[yellow]There is no recorded history for the selected tile (` + tile.x + ', ' + tile.y + ').'
    );
    p.tilelog = false;
    return;
  }

  const history = [];

  tileHistory[pos].forEach((t) =>
    history.push(t.name + `[yellow] ` + t.action + ' a block ' + utils.getTimeSinceText(t.time))
  );
  p.tilelog = false;
  realP.sendMessage(history.join('\n'));
  return;
});

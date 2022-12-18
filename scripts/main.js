importPackage(Packages.arc);
importPackage(Packages.mindustry.type);
const utils = require('helper2');
const players = require('players');
const trails = require('trails');
const timers = require('timers');
const config = require('config');
const staff = require('staff');
const menus = require('menus');
const ohno = require('ohno');
const staffCommands = require('commands/staffCommands');
const playerCommands = require('commands/playerCommands');
const whisper = require('whisper');
const membership = require('membership');

let serverCommands;
let serverIp;
let tileHistory = {};

Events.on(PlayerJoin, (e) => {
  players.setName(e.player);
});

Events.on(ServerLoadEvent, (e) => {
  const ActionType = Packages.mindustry.net.Administration.ActionType;
  const clientCommands = Vars.netServer.clientCommands;
  serverCommands = Core.app.listeners.find(
    (l) => l instanceof Packages.mindustry.server.ServerControl
  ).handler;

  // Mute muted players
  Vars.netServer.admins.addChatFilter((realP, text) => {
    const p = players.getP(realP);

    if (p.muted) {
      realP.sendMessage('[scarlet]⚠ [yellow]You are muted.');
      return null;
    }

    if (p.highlight) {
      return p.highlight + text;
    }

    return config.bannedWords.some((bw) => text.includes(bw))
      ? '[#f456f]I really hope everyone is having a fun time :) <3'
      : text;
  });

  // Action filters
  Vars.netServer.admins.addActionFilter((action) => {
    const realP = action.player;
    const p = players.getP(realP);

    if (action.type === ActionType.rotate) {
      if (p.stopped) {
        realP.sendMessage('[scarlet]⚠ [yellow]You are stopped, you cant perfom this action.');
        return false;
      }

      const fakeE = {
        unit: realP.unit(),
        tile: action.tile,
        player: realP,
        breaking: null,
      };
      addToTileHisotry(fakeE, 'rotate');
      return true;
    }
    //prevent stopped players from configuring
    if (p.stopped) {
      if (action.type == ActionType.depositItem) {
        return true;
      }
      action.player.sendMessage('[scarlet]⚠ [yellow]You are stopped, you cant perfom this action.');
      return false;
    }
    return true;
  });

  const runner = (method) => new Packages.arc.util.CommandHandler.CommandRunner({ accept: method });

  clientCommands.removeCommand('help');
  // clientCommands.removeCommand('votekick');
  // clientCommands.removeCommand('vote');

  staffCommands.registerCommands(clientCommands, runner);
  playerCommands.registerCommands(clientCommands, runner);
  ohno.registerCommands(clientCommands, runner);
  whisper.registerCommands(clientCommands, runner);
  trails.registerCommands(clientCommands, runner);
  membership.registerCommands(clientCommands, runner);

  Core.settings.remove('lastRestart');

  const getIp = Http.get('https://api.ipify.org?format=js');
  getIp.submit((r) => {
    serverIp = r.getResultAsString();
  });
});

const addToTileHisotry = (e, eventType) => {
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
  addToTileHisotry(e, 'build');
});

Events.on(TapEvent, (e) => {
  const p = players.getP(e.player);
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
    p.tilelog = null;
    return;
  }

  const history = [];

  tileHistory[pos].forEach((t) =>
    history.push(t.name + `[yellow] ` + t.action + ' a block ' + utils.getTimeSinceText(t.time))
  );
  p.tilelog = null;
  realP.sendMessage(history.join('\n'));
  return;
});

importPackage(Packages.arc);
importPackage(Packages.mindustry.type);
const utils = require('helper2');

//CONSTANTS
const STOPPED_PREFIX = '[yellow]⚠[scarlet]Marked Griefer[yellow]⚠[white]';
const ADMIN_PREFIX = '[black]<[scarlet]A[black]>';
const MOD_PREFEIX = '[black]<[green]M[black]>';
const AFK_PREFIX = '[orange] AFK  | [white]';
const MUTED_PREFIX = '[white](muted)';

let serverIp = '';

const menuStuff = {
  listeners: {},
  flattenedNonStaffPlayers: [],
  lastOptionIndex: 0,
};

let ohnoSpawnOverride = false;
let serverCommands;

const save = () => {
  const newPlayers = {};
  Object.keys(players).forEach((pl) => {
    if (players[pl].admin || players[pl].mod) {
      newPlayers[pl] = players[pl];
    }
    return;
  });
  const stringified = JSON.stringify(newPlayers);
  Core.settings.put('fish', stringified);
  Core.settings.manualSave();
};

const clean = (con) => {
  Timer.schedule(
    () => {
      Call.sound(con, Sounds.rockBreak, 1, 1, 0);
    },
    0,
    0.05,
    10
  );
  Vars.world.tiles.eachTile((t) => {
    if ([107, 109, 106, 111, 108, 112, 117, 115, 116, 110, 125].includes(t.block().id)) {
      t.setNet(Blocks.air, Team.sharded, 0);
    }
  });
};

const tp = (plr, p2) => plr.unit().set(p2.unit().x, p2.unit().y);

const plrByName = (plr) => {
  const newPlr = plr.toLowerCase();
  const realPlayer = Groups.player.find((p) => {
    if (p.name === newPlr) return true;
    if (p.name.includes(newPlr)) return true;
    if (p.name.toLowerCase().includes(newPlr)) return true;
    if (Strings.stripColors(p.name).toLowerCase() === newPlr) return true;
    if (Strings.stripColors(p.name).toLowerCase().includes(newPlr)) return true;
    return false;
  });
  return realPlayer;
};

const plrById = (id) => Groups.player.find((p) => p.uuid() === id);

const totalOhno = () => {
  let total = 0;
  Groups.unit.each((u) => {
    if (u.type === UnitTypes.alpha && u.flying === false) {
      total++;
    }
  });
  return total;
};

const canSpawnOhno = () => {
  if (ohnoSpawnOverride) {
    return false;
  }
  const totalPlayers = Groups.player.size();
  return totalOhno() < totalPlayers;
};

const ohno = (p) => {
  if (!canSpawnOhno()) {
    p.sendMessage('[scarlet]⚠[yellow]Sorry, the max number of ohno units has been reached.');
    return;
  }
  const existing = []; // Keep track of spawned units to avoid changing wrong ones

  Groups.unit.each((u) => {
    // loop through all units and save their id
    if (u.type === UnitTypes.atrax) {
      existing.push(u.id);
    }
  });

  UnitTypes.atrax.spawn(Team.sharded, p.unit().x, p.unit().y); // spawn unit at player's position

  const targetUnit = Groups.unit.find(
    // get the unit we just spawned
    (u) => u.type === UnitTypes.atrax && !existing.includes(u.id)
  );
  targetUnit.type = UnitTypes.alpha; // change the type to make an ohno unit
  targetUnit.apply(StatusEffects.disarmed, 10000);
  ohnos.push(targetUnit.id); // global for keeping track of how many are spawned
  targetUnit.resetController(); // this gives them mono AI
};

const killOhno = () => {
  Groups.unit.each((u) => {
    if (ohnos.includes(u.id)) {
      u.kill();
    }
  });
  ohnos = [];
};

const setName = (realP) => {
  const p = players[realP.uuid()];
  p.name = realP.name;

  if (p.muted) {
    realP.name = MUTED_PREFIX + p.name;
    return;
  }

  if (realP.admin) {
    p.admin = true;
    realP.name = ADMIN_PREFIX + realP.name;
    return;
  }

  if (p.admin) {
    realP.admin = true;
    realP.name = ADMIN_PREFIX + realP.name;
    return;
  }

  if (p.mod) {
    realP.name = MOD_PREFEIX + realP.name;
    return;
  }

  if (p.stopped) {
    realP.name = STOPPED_PREFIX + realP.name;
    return;
  }
};

const getName = (realP) => {
  const p = players[realP.uuid()];

  if (p.muted) {
    return MUTED_PREFIX + p.name;
  }

  if (realP.admin) {
    return ADMIN_PREFIX + p.name;
  }

  if (p.admin) {
    return ADMIN_PREFIX + p.name;
  }

  if (p.mod) {
    return MOD_PREFEIX + p.name;
  }

  if (p.stopped) {
    return STOPPED_PREFIX + p.name;
  }

  return p.name;
};

const createPlayer = (player) => {
  players[player.uuid()] = {
    name: player.name,
    muted: false,
  };
};

const addPlayerHistory = (id, entry) => {
  const p = players[id];

  if (!p.history) {
    p.history = [];
  }

  if (p.history.length > 5) {
    p.history.shift();
  }

  p.history.push(entry);
};

let ohnos = [];

let trails = [];

let players = {};

let whisper = {};

Events.on(PlayerChatEvent, (e) => {
  const player = e.player;
  const p = players[player.uuid()];

  if (!p.fakeAdmin) {
    return;
  }
  const text = e.message;

  if (text[0] !== '/') {
    return;
  }

  Groups.player.forEach((p) => {
    const lp = players[p.uuid()];
    if (!lp.admin && !lp.mod) {
      return;
    }
    p.sendMessage('[salmon]{' + player.name + '[salmon]} just tried:' + text);
    return;
  });

  if (text.includes('kick')) {
    player.sendMessage('[yellow]Player kicked.');
    return;
  }

  if (text.includes('ban')) {
    player.sendMessage('[yellow]Player banned.');
    return;
  }

  if (text.includes('stop')) {
    player.sendMessage(
      '[yellow]Stopping server in: [green]14 [yellow]minutes and [green]59 [yellow]seconds.'
    );
    return;
  }

  if (text.includes('kill')) {
    player.sendMessage('[yellow]Player killed.');
    return;
  }
});

Events.on(PlayerLeave, (e) => {
  const totalPlayers = Groups.player.size();
  if (totalOhno() > totalPlayers - 1) {
    const poorOhno = Groups.unit.find(
      (u) => u.type === UnitTypes.alpha && u.flying === false && !u.player
    );
    if (poorOhno) poorOhno.kill();
    else {
      const poorerOhno = Groups.unit.find(
        (u) =>
          u.type === UnitTypes.alpha && u.flying === false && u.player.uuid() === e.player.uuid()
      );
      if (poorerOhno) poorerOhno.kill();
    }
  }
  trails = trails.filter((id) => id !== e.player.uuid());
});

Events.on(PlayerJoin, (e) => {
  const realP = e.player;

  if (!players[realP.uuid()]) createPlayer(realP);

  const p = players[realP.uuid()];

  if (Groups.player.size() === 1) {
    Call.sendMessage('[#48e076]Game unpaused.');
  }
  Vars.state.serverPaused = false;

  setName(realP);
});

Events.on(UnitChangeEvent, (e) => {
  const p = e.player;

  if (players[p.uuid()].stopped) {
    p.unit().type = UnitTypes.stell;
  }
});

Events.on(UnitControlEvent, (e) => {
  const p = e.player;

  if (players[p.uuid()].stopped) {
    p.unit().type = UnitTypes.stell;
  }
});

let tileHistory = {};

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
  if (players[e.player.uuid()].tileId) {
    e.player.sendMessage(e.tile.block().id);
    players[e.player.uuid()].tileId = false;
  }
  if (!players[e.player.uuid()].tilelog) return;
  const realP = e.player;
  const p = players[realP.uuid()];
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
    history.push(t.name + `[yellow] ` + t.action + ' a block ' + getTimeSinceText(t.time))
  );
  p.tilelog = null;
  realP.sendMessage(history.join('\n'));
  return;
});

const getTimeSinceText = (old) => {
  const now = Date.now();
  const timeLeft = now - old;

  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  let timeSince = '';

  if (hours) {
    timeSince += '[green]' + hours + ' [lightgray]hrs, ';
  }

  if (minutes) {
    timeSince += '[green]' + minutes + ' [lightgray]mins, ';
  }

  timeSince += '[green]' + seconds + ' [lightgray]secs ago.';

  return timeSince;
};

Events.on(GameOverEvent, (e) => {
  tileHistory = {};
});

let ActionType;

Events.on(ServerLoadEvent, (e) => {
  ActionType = Packages.mindustry.net.Administration.ActionType;
  const clientCommands = Vars.netServer.clientCommands;
  serverCommands = Core.app.listeners.find(
    (l) => l instanceof Packages.mindustry.server.ServerControl
  ).handler;
  const runner = (method) => new Packages.arc.util.CommandHandler.CommandRunner({ accept: method });

  const stringified = Core.settings.get('fish', '');

  if (stringified) players = JSON.parse(stringified);

  // Mute muted players
  Vars.netServer.admins.addChatFilter((realP, text) => {
    const p = players[realP.uuid()];

    if (p.muted) {
      realP.sendMessage('[scarlet]⚠ [yellow]You are muted.');
      return null;
    }

    return text;
  });

  // Action filters
  Vars.netServer.admins.addActionFilter((action) => {
    const realP = action.player;
    const p = players[realP.uuid()];

    if (action.type === ActionType.rotate) {
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

  // Menus
  const stopListener = (player, option) => {
    if (option === -1 || option === menuStuff.lastOptionIndex) return;

    const p = players[menuStuff.flattenedNonStaffPlayers[option]];
    const pObj = plrById(menuStuff.flattenedNonStaffPlayers[option]);

    p.stopped = true;
    pObj.unit().type = UnitTypes.stell;
    player.sendMessage(pObj.name + '[#48e076] was stopped.');
    pObj.name = STOPPED_PREFIX + pObj.name;
    pObj.sendMessage("[scarlet]Oopsy Whoopsie! You've been stopped, and marked as a griefer.");
    addPlayerHistory(pObj.uuid(), {
      action: 'stopped',
      by: player.name,
      time: Date.now(),
    });
    save();

    return;
  };

  const muteListener = (player, option) => {
    if (option === -1 || option === menuStuff.lastOptionIndex) return;

    const p = players[menuStuff.flattenedNonStaffPlayers[option]];
    const pObj = plrById(menuStuff.flattenedNonStaffPlayers[option]);

    p.muted = !p.muted;
    player.sendMessage(pObj.name + '[#48e076] was ' + p.muted ? 'muted.' : 'unmuted');
    pObj.name = getName(pObj);
    pObj.sendMessage(
      p.muted
        ? '[yellow] Hey! You have been muted. You can still use /msg to send a message to someone though.'
        : '[green]You have been unmuted.'
    );
    addPlayerHistory(pObj.uuid(), {
      action: tp.muted ? 'muted' : 'unmuted',
      by: player.name,
      time: Date.now(),
    });
    save();

    return;
  };

  menuStuff.listeners.stop = Menus.registerMenu(stopListener);
  menuStuff.listeners.mute = Menus.registerMenu(muteListener);

  // fake admin
  clientCommands.register(
    'sus',
    '<uwu>',
    'if you know, you know.',
    runner((args, realP) => {
      if (realP.admin) {
        const targetPlr = plrByName(args[0]);

        if (!targetPlr) {
          realP.sendMessage('[scarlet]⚠ [yellow]Player not found.');
          return;
        }

        const targetP = players[targetPlr.uuid()];

        if (targetP.fakeAdmin === undefined) {
          targetP.fakeAdmin = false;
        }

        targetP.fakeAdmin = !targetP.fakeAdmin;

        if (targetP.fakeAdmin) {
          targetPlr.sendMessage('[green]You just got promoted to Admin!');
        }

        realP.sendMessage(
          `[salmon]Player ` +
            targetPlr.name +
            `[salmon]'s fake admin status toggled ` +
            '[green]' +
            targetP.fakeAdmin
        );
        return;
      } else {
        return;
      }
    })
  );

  // warn
  clientCommands.register(
    'warn',
    '<name> [reason...]',
    'warn a player',
    runner((args, realP) => {
      const typedPlr = args[0];
      const reason = args[1];
      const targetPlr = plrByName(typedPlr);
      const p = players[realP.uuid()];

      if (p.admin || p.mod) {
        if (!targetPlr) {
          realP.sendMessage('[scarlet]⚠ "' + typedPlr + '"' + ' [yellow] was not found.');
          return;
        }

        const canWarn = !targetPlr.admin && !players[targetPlr.uuid()].mod;
        // const canWarn = true;
        if (canWarn) {
          const newReason = reason
            ? '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n[scarlet]_____YOU HAVE BEEN WARNED BY A STAFF MEMBER._____\n\n\nReason: ' +
              '[yellow]' +
              reason
            : '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n[scarlet]_____YOU HAVE BEEN WARNED BY A STAFF MEMBER._____\n\n\n[yellow]A staff member has warned you. I suggest you stop doing what you are doing.';
          targetPlr.sendMessage(newReason + '\n\n\n\n\n\n\n\n\n\n\n\n\n');
          realP.sendMessage(
            targetPlr.name + '[yellow]Was given a warning with the reason: "' + newReason + '"'
          );
          addPlayerHistory(targetPlr.uuid(), {
            action: 'warned',
            by: realP.name,
            time: Date.now(),
          });
          return;
        } else {
          realP.sendMessage('[scarlet]⚠[yellow] You do not have permission to warn this player.');
        }
      } else {
        realP.sendMessage('[scarlet]⚠[yellow] You do not have access to this command.');
        return;
      }
    })
  );

  // Mute
  clientCommands.register(
    'mute',
    '[player(optional)]',
    'Toggle whether a player is muted or not.',
    runner((args, realP) => {
      const p = players[realP.uuid()];

      if (p.fakeAdmin) {
        return;
      }

      if (!p.mod && !p.admin) {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
        return;
      }

      if (args[0]) {
        const foundPlayer = plrByName(args[0]);
        if (!foundPlayer) {
          realP.sendMessage('[scarlet]⚠ [yellow]Player "' + args[0] + '[yellow]" not found.');
          return;
        }
        const tp = players[foundPlayer.uuid()];

        tp.muted = !tp.muted;

        realP.sendMessage(foundPlayer.name + '[#48e076] was ' + tp.muted ? 'muted.' : 'unmuted');
        foundPlayer.name = getName(foundPlayer);
        foundPlayer.sendMessage(
          tp.muted
            ? '[yellow] Hey! You have been muted. You can still use /msg to send a message to someone though.'
            : '[green]You have been unmuted.'
        );
        addPlayerHistory(foundPlayer.uuid(), {
          action: tp.muted ? 'muted' : 'unmuted',
          by: realP.name,
          time: Date.now(),
        });
        save();
        return;
      }

      menuStuff.flattenedNonStaffPlayers = [];
      menuStuff.lastOptionIndex = 0;

      const title = 'Mute';
      const message = 'Choose a player to mute/unmute.';
      let options = [[]];
      let arrayIndex = 0;
      Groups.player.forEach((pl) => {
        const pp = players[pl.uuid()];
        if (pp.mod || pp.admin) return;

        menuStuff.flattenedNonStaffPlayers.push(pl.uuid());

        if (options[arrayIndex].length >= 2) {
          arrayIndex += 1;
          menuStuff.lastOptionIndex += 1;
          options[arrayIndex] = [pp.name];
          return;
        } else {
          menuStuff.lastOptionIndex += 1;
          options[arrayIndex].push(pp.name);
          return;
        }
      });

      if (options[0].length === 0) options = [];

      options.push(['cancel']);

      Call.menu(realP.con, menuStuff.listeners.mute, title, message, options);
    })
  );

  // Kick
  clientCommands.register(
    'kick',
    '<player> [reason...]',
    'Kick a player with optional reason.',
    runner((args, realP) => {
      const p = players[realP.uuid()];

      if (p.fakeAdmin) {
        return;
      }

      if (p.admin || p.mod) {
        const typedPlr = args[0];
        const reason = args[1];
        const targetPlr = plrByName(typedPlr);

        if (!targetPlr) {
          realP.sendMessage('[scarlet]⚠ "' + typedPlr + '"' + ' [yellow] was not found.');
          return;
        }

        const canKickPlr = !targetPlr.admin && !players[targetPlr.uuid()].mod;
        // const canKickPlr = true;
        if (canKickPlr) {
          targetPlr.kick(reason ? reason : 'A staff member did not like your actions.');
          return;
        } else {
          realP.sendMessage('[scarlet]⚠[yellow] You do not have permission to kick this player.');
        }
      } else {
        realP.sendMessage('[scarlet]⚠[yellow] You do not have access to this command.');
        return;
      }
    })
  );

  // Stop
  clientCommands.register(
    'stop',
    '[player(optional)]',
    'stop a player.',
    runner((args, realP) => {
      const p = players[realP.uuid()];

      if (p.fakeAdmin) {
        return;
      }

      if (!p.mod && !p.admin) {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
        return;
      }

      if (args[0]) {
        const foundPlayer = plrByName(args[0]);
        if (!foundPlayer) {
          realP.sendMessage('[scarlet]⚠ [yellow]Player "' + args[0] + '[yellow]" not found.');
          return;
        }
        const tp = players[foundPlayer.uuid()];
        tp.stopped = true;
        foundPlayer.unit().type = UnitTypes.stell;
        realP.sendMessage(foundPlayer.name + '[#48e076] was stopped.');
        foundPlayer.name = STOPPED_PREFIX + foundPlayer.name;
        foundPlayer.sendMessage(
          "[scarlet]Oopsy Whoopsie! You've been stopped, and marked as a griefer."
        );
        addPlayerHistory(foundPlayer.uuid(), {
          action: 'stopped',
          by: realP.name,
          time: Date.now(),
        });
        save();
        return;
      }

      menuStuff.flattenedNonStaffPlayers = [];
      menuStuff.lastOptionIndex = 0;

      const title = 'Stop';
      const message = 'Choose a player to stop.';
      let options = [[]];
      let arrayIndex = 0;
      Groups.player.forEach((pl) => {
        const pp = players[pl.uuid()];
        if (pp.mod || pp.admin || p.stopped) return;

        menuStuff.flattenedNonStaffPlayers.push(pl.uuid());

        if (options[arrayIndex].length >= 2) {
          arrayIndex += 1;
          menuStuff.lastOptionIndex += 1;
          options[arrayIndex] = [pl.name];
          return;
        } else {
          menuStuff.lastOptionIndex += 1;
          options[arrayIndex].push(pl.name);
          return;
        }
      });

      if (options[0].length === 0) options = [];

      options.push(['cancel']);

      Call.menu(realP.con, menuStuff.listeners.stop, title, message, options);
    })
  );

  // Free
  clientCommands.register(
    'free',
    '<player>',
    'frees a player.',
    runner((args, realP) => {
      const p = players[realP.uuid()];
      if (p.admin || p.mod) {
        const typedPlr = args[0];
        const targetPlr = plrByName(typedPlr);

        if (!targetPlr) {
          realP.sendMessage('[scarlet]⚠ "' + typedPlr + '"' + ' [yellow] was not found.');
          return;
        }

        const canFreePlr = players[targetPlr.uuid()].stopped;
        if (canFreePlr) {
          targetPlr.name = players[targetPlr.uuid()].name;
          players[targetPlr.uuid()].stopped = false;
          targetPlr.unit().type = UnitTypes.alpha;
          realP.sendMessage(targetPlr.name + '[#48e076] was freed.');
          targetPlr.sendMessage('[yellow]Looks like someone had mercy on you.');
          addPlayerHistory(targetPlr.uuid(), {
            action: 'freed',
            by: realP.name,
            time: Date.now(),
          });
          save();
          return;
        } else {
          realP.sendMessage('[scarlet]⚠[yellow] ' + targetPlr.name + ' is not stopped.');
          return;
        }
      } else {
        realP.sendMessage('[scarlet]⚠ You do not have access to this command.');
        return;
      }
    })
  );

  // Mod
  clientCommands.register(
    'mod',
    '<add/remove> <player>',
    "add or remove a player's mod status.",
    runner((args, realP) => {
      const p = players[realP.uuid()];
      if (p.admin) {
        const action = args[0];
        const typedPlr = args[1];
        const targetPlr = plrByName(typedPlr);

        if (action !== 'add' && action !== 'remove') {
          realP.sendMessage(
            '[scarlet]⚠[scarlet] Invalid argument. [yellow]usage: "/mod <add|remove> <player>"'
          );
          return;
        }

        if (!targetPlr) {
          realP.sendMessage('[scarlet]⚠ "' + typedPlr + '"' + ' [yellow] was not found.');
          return;
        }

        const canAddPlr = !players[targetPlr.uuid()].mod && !players[targetPlr.uuid()].admin;
        if (action === 'add' && !canAddPlr) {
          realP.sendMessage('[scarlet]⚠ ' + targetPlr.name + ' [yellow]is already a staff member.');
          return;
        }

        if (action === 'add') {
          players[targetPlr.uuid()].mod = true;
          realP.sendMessage(targetPlr.name + '[#48e076] is now ranked Moderator.');
          targetPlr.sendMessage('[yellow] Your rank is now [#48e076]Moderator.');
          targetPlr.name = MOD_PREFEIX + targetPlr.name;
          save();
          return;
        }

        const canRemovePlr = players[targetPlr.uuid()].mod;
        if (action === 'remove' && !canRemovePlr) {
          realP.sendMessage('[scarlet]⚠ ' + targetPlr.name + ' [yellow]is not a Moderator.');
          return;
        }

        if (action === 'remove') {
          targetPlr.name = players[targetPlr.uuid()].name;
          players[targetPlr.uuid()].mod = false;
          realP.sendMessage(targetPlr.name + '[#48e076] just got demoted to player.');
          save();
          return;
        }
      } else {
        realP.sendMessage('[scarlet]You do not have access to this command.');
        return;
      }
    })
  );

  // Admin
  clientCommands.register(
    'admin',
    '<add/remove> <player>',
    "add or remove a player's admin status.",
    runner((args, realP) => {
      const p = players[realP.uuid()];
      if (p.admin) {
        const action = args[0];
        const typedPlr = args[1];
        const targetPlr = plrByName(typedPlr);

        if (action !== 'add' && action !== 'remove') {
          realP.sendMessage(
            '[scarlet]⚠[scarlet] Invalid argument. [yellow]usage: "/admin <add|remove> <player>"'
          );
          return;
        }

        if (!targetPlr) {
          realP.sendMessage('[scarlet]⚠ "' + typedPlr + '"' + ' [yellow] was not found.');
          return;
        }

        const canAddPlr = !players[targetPlr.uuid()].admin;
        if (action === 'add' && !canAddPlr) {
          realP.sendMessage('[scarlet]⚠ ' + targetPlr.name + ' [yellow]is already an admin.');
          return;
        }

        if (action === 'add') {
          players[targetPlr.uuid()].admin = true;
          targetPlr.admin = true;
          realP.sendMessage(targetPlr.name + '[#48e076] is now ranked Admin.');
          targetPlr.sendMessage('[yellow] Your rank is now [#514ced]Admin.');
          targetPlr.name = ADMIN_PREFIX + targetPlr.name;
          save();
          return;
        }

        const canRemovePlr = players[targetPlr.uuid()].admin;
        if (action === 'remove' && !canRemovePlr) {
          realP.sendMessage('[scarlet]⚠ ' + targetPlr.name + ' [yellow]is not an Admin.');
          return;
        }

        if (action === 'remove') {
          targetPlr.name = players[targetPlr.uuid()].name;
          players[targetPlr.uuid()].admin = false;
          targetPlr.admin = false;
          realP.sendMessage(targetPlr.name + '[#48e076] just got demoted to player.');
          save();
          return;
        }
      } else {
        realP.sendMessage('[scarlet]You do not have access to this command.');
        return;
      }
    })
  );

  // Clean
  clientCommands.register(
    'clean',
    'clear the map of boulders.',
    runner((args, realP) => {
      clean(realP.con);
    })
  );

  // Ohno
  clientCommands.register(
    'ohno',
    '[on/off]',
    'spawns an ohno unit.',
    runner((args, realP) => {
      if (['on', 'off'].includes(args[0]) && realP.admin) {
        ohnoSpawnOverride = args[0] === 'off';
        realP.sendMessage('[yellow]Toggled OhNo units to: [green]' + args[0]);
        return;
      }

      ohno(realP);
    })
  );

  // Kill
  clientCommands.register(
    'kill',
    'commit die.',
    runner((args, realP) => {
      const p = players[realP.uuid()];
      if (p.fakeAdmin) {
        return;
      }
      realP.unit().kill();
    })
  );

  // Murder
  clientCommands.register(
    'murder',
    'Kills all ohno units',
    runner((args, realP) => {
      const p = players[realP.uuid()];
      if (p.admin || p.mod) {
        const killed = totalOhno();
        killOhno();
        realP.sendMessage(
          '[yellow]You massacred ' + '[#48e076]' + killed + '[yellow] helpless ohno crawlers.'
        );
        return;
      } else {
        realP.sendMessage("[yellow]You're a [scarlet]monster[yellow].");
        return;
      }
    })
  );

  // Msg
  clientCommands.register(
    'msg',
    '<player> <message...>',
    'send a private message to a player.',
    runner((args, realP) => {
      const p = players[realP.uuid()];
      const typedPlr = args[0];
      const targetPlr = plrByName(typedPlr);
      if (!targetPlr) {
        realP.sendMessage('[scarlet]⚠ "' + typedPlr + '"' + ' [yellow] was not found.');
        return;
      }

      const dm = args[1];

      if (!dm || !dm.length || dm === '') {
        realP.sendMessage(
          '[scarlet]⚠ [yellow]You must type a message to send. Usage: [white]"/msg <player> <message>"'
        );
        return;
      }

      const pid = realP.uuid();
      const tid = targetPlr.uuid();

      if (!whisper[tid]) whisper[tid] = { from: pid };
      if (!whisper[tid].from || whisper[tid].from !== pid) whisper[tid] = { from: pid };

      targetPlr.sendMessage(realP.name + '[lightgray] whispered:[#0ffffff0] ' + dm);
      realP.sendMessage('[#0ffffff0]Message sent to ' + targetPlr.name + '[#0ffffff0].');
      return;
    })
  );

  // Reply
  clientCommands.register(
    'r',
    '<message...>',
    'reply to most recent message.',
    runner((args, realP) => {
      const p = players[realP.uuid()];
      const pid = realP.uuid();

      const dm = args[0];
      if (!dm) {
        realP.sendMessage(
          '[scarlet]⚠ You must type a message to send. Usage: [white]"/r <message>"'
        );
        return;
      }

      if (!whisper[pid] || !whisper[pid].from) {
        realP.sendMessage(
          `[scarlet]⚠ [yellow]It doesn't look like someone has messaged you recently.. Try whispering to them with [white]"/msg <player> <message>"`
        );
        return;
      }

      const targetPlr = plrById(whisper[pid].from);
      const tid = targetPlr.uuid();

      targetPlr.sendMessage(realP.name + '[lightgray] whispered:[#0ffffff0] ' + dm);
      realP.sendMessage('[#0ffffff0]Message sent to ' + targetPlr.name + '[#0ffffff0].');
      if (!whisper[tid]) {
        whisper[tid] = { from: pid };
        return;
      } else {
        whisper[tid].from = pid;
        return;
      }
    })
  );

  // Discord
  clientCommands.register(
    'discord',
    'puts server/discord details into a message block below you.',
    runner((args, realP) => {
      Call.openURI(realP.con, 'https://discord.gg/VpzcYSQ33Y');
    })
  );

  // Tilelog
  clientCommands.register(
    'tilelog',
    'check recent build history of a tile.',
    runner((args, realP) => {
      const p = players[realP.uuid()];
      p.tilelog = true;
      realP.sendMessage(
        "\n \n \n===>[yellow]Click on a tile to check it's recent history...\n \n \n "
      );
      return;
    })
  );

  // Afk
  clientCommands.register(
    'afk',
    'mark/unmark yourself as afk.',
    runner((args, realP) => {
      const p = players[realP.uuid()];
      if (p.afk) {
        p.afk = false;
        realP.name = getName(realP);
        realP.sendMessage('[yellow] You are no longer AFK.');
        return;
      }
      p.afk = true;
      realP.name = AFK_PREFIX + getName(realP);
      realP.sendMessage('[yellow] You are marked as AFK.');
    })
  );

  // unmuteall
  clientCommands.register(
    'unmuteall',
    'unmute all muted players.',
    runner((args, realP) => {
      const p = players[realP.uuid()];
      if (p.admin || p.mod) {
        const allIds = Object.keys(players);
        allIds.forEach((id) => {
          const targetPlr = plrById(id);
          if (!targetPlr) return;
          if (players[id].muted) {
            players[id].muted = false;
            targetPlr.name = players[id].name;
          }
        });
        realP.sendMessage('[#48e076]All players have the ability to speak.');
      } else {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have permission to use this command.');
      }
    })
  );

  // Unpause
  clientCommands.register(
    'unpause',
    'unpauses the game.',
    runner((args, realP) => {
      Vars.state.serverPaused = false;
      realP.sendMessage('[green]Game unpaused.');
      return;
    })
  );

  // Restart
  clientCommands.register(
    'restart',
    'saves and restarts the server.',
    runner((args, realP) => {
      const old = Core.settings.get('lastRestart', '');

      if (!realP.admin) {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
        return;
      }

      if (old !== '') {
        const numOld = Number(old);
        const now = Date.now();

        if (now - numOld < 600000) {
          realP.sendMessage(
            '[scarlet]⚠ [yellow]You need to wait at least 10 minutes between restarts.'
          );
          return;
        }

        Core.settings.put('lastRestart', String(now));
        Core.settings.manualSave();

        const file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);

        Core.app.post(() => {
          SaveIO.save(file);
          utils.log('[green]Game saved. [scarlet]Server restarting in 5 seconds!');
          Timer.schedule(() => {
            Core.app.exit();
          }, 5);
        });
      } else {
        const now = Date.now();
        Core.settings.put('lastRestart', String(now));
        Core.settings.manualSave();

        const file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);

        Core.app.post(() => {
          SaveIO.save(file);
          realP.sendMessage('[green]Game saved. [scarlet]Server restarting in 5 seconds!');
          Timer.schedule(() => {
            Core.app.exit();
          }, 5);
        });
      }
    })
  );

  // history
  clientCommands.register(
    'history',
    '<player>',
    'Show moderation history for a player.',
    runner((args, realP) => {
      const p = players[realP.uuid()];

      if (!p.admin && !p.mod) {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
        return;
      }

      const targetP = plrByName(args[0]);
      if (!targetP) {
        realP.sendMessage(
          '[scarlet]⚠ [yellow]No player was found containing ' + '"' + args[0] + '".'
        );
        return;
      }

      const tp = players[targetP.uuid()];
      if (!tp.history || !tp.history.length) {
        realP.sendMessage('[yellow]No history was found for ' + tp.name + '[yellow].');
        return;
      }
      let message = ['[yellow]_______________Player history_______________\n\n'];

      tp.history.forEach((h) => {
        message.push(
          h.by + ' [yellow]' + h.action + ' ' + tp.name + ' [white]' + getTimeSinceText(h.time)
        );
      });

      realP.sendMessage(message.join('\n'));
      return;
    })
  );

  // trail
  clientCommands.register(
    'trail',
    'add/remove your trail.',
    runner((args, realP) => {
      if (trails.includes(realP.uuid())) {
        trails = trails.filter((id) => id !== realP.uuid());
        return;
      }

      trails.push(realP.uuid());

      return;
    })
  );

  // tileid
  clientCommands.register(
    'tileid',
    'check id of a tile',
    runner((args, realP) => {
      const p = players[realP.uuid()];
      p.tileId = true;
      realP.sendMessage('[green]Click a tile to check its id.');
    })
  );

  // attack
  clientCommands.register(
    'attack',
    'switch to the attack server',
    runner((args, realP) => {
      Call.sendMessage(
        realP.name +
          '[magenta] has gone to the attack server. Use [cyan]/attack [magenta]to join them!'
      );
      Call.connect(realP.con, '45.79.203.155', '6567');
    })
  );

  // survival
  clientCommands.register(
    'survival',
    'switch to the survival server',
    runner((args, realP) => {
      Call.sendMessage(
        realP.name +
          '[magenta] has gone to the survival server. Use [cyan]/survival [magenta]to join them!'
      );
      Call.connect(realP.con, '170.187.144.235', '6567');
    })
  );

  // save
  clientCommands.register(
    'save',
    'saves the game state.',
    runner((args, realP) => {
      const p = players[realP.uuid()];
      if (!p.admin && !p.mod) {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
        return;
      }

      save();
      realP.sendMessage('[green]Game saved.');
      return;
    })
  );

  // Load
  // clientCommands.register(
  //   'load',
  //   'loads the most recent game state.',
  //   runner((args, realP) => {
  //     const p = players[realP.uuid()];
  //     if (!p.admin && !p.mod) {
  //       realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
  //       return;
  //     }

  //     if (serverIp === '') {
  //       realP.sendMessage('[scarlet]⚠ [yellow]There was an issue loading the last save.');
  //       return;
  //     }

  //     const file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);

  //     Core.app.post(() => {
  //       SaveIO.load(file);
  //       Vars.state.set(GameState.State.playing);

  //       Groups.player.forEach((player) => {
  //         // Broken ???
  //         Call.connect(player.con, serverIp, '6567');
  //       });
  //     });
  //   })
  // );

  // wave
  clientCommands.register(
    'wave',
    '<number>',
    'sets the wave number.',
    runner((args, realP) => {
      const p = players[realP.uuid()];

      if (p.admin) {
        const wave = args[0];
        if (wave > 0) {
          Vars.state.wave = wave;
          return;
        }
        realP.sendMessage('[scarlet]⚠ [yellow]Wave must be above 0.');
        return;
      } else {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
        return;
      }
    })
  );

  Core.settings.remove('lastRestart');

  const getIp = Http.get('https://api.ipify.org?format=js');
  getIp.submit((r) => {
    serverIp = r.getResultAsString();
  });
});

// Timers /////////////////////////////////////////

// autopause
Timer.schedule(
  () => {
    const totalPlayers = Groups.player.size();
    if (totalPlayers === 0) {
      Vars.state.serverPaused = true;
    }

    if (totalPlayers > 0) {
      Vars.state.serverPaused = false;
    }
  },
  0,
  5
);

// AutoSave
Timer.schedule(
  () => {
    const file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);

    Core.app.post(() => {
      SaveIO.save(file);
      Call.sendMessage('[#4fff8f9f]Game saved.');
    });
  },
  10,
  300
);

const colors = ['acid', 'pink', 'teal', 'orange', 'purple', 'coral', 'crimson'];
// autopause
Timer.schedule(
  () => {
    const ranColor = colors[Math.floor(Math.random() * colors.length)];

    trails.forEach((id) => {
      const p = plrById(id);
      if (!p) return;
      Call.effect(Fx.bubble, p.x, p.y, 0, Color[ranColor]);
    });
  },
  10,
  0.2
);

// Staff online
Timer.schedule(
  () => {
    const staff = utils.memoize(
      () => {
        const tempStaff = ['Staff online:'];
        Groups.player.forEach((pl) => {
          const p = players[pl.uuid()];
          if (p.admin || p.mod) {
            tempStaff.push(p.name);
          }
        });
        return tempStaff;
      },
      [Groups.player.size()],
      1
    );

    if (!staff.length) {
      return;
    }

    Call.infoPopup(staff.join('\n'), 5, Align.topRight, 200, 0, 0, 0);
  },
  5, // time to wait before first execution in seconds
  5 // interval in seconds
);

// disable ohnos
Timer.schedule(
  () => {
    const temp = Groups.unit.find((u) => u.id === ohnos[0]);
    if (!ohnos.length) return;

    Groups.unit.forEach((u) => {
      if (ohnos.includes(u.id)) {
        u.apply(StatusEffects.disarmed, 10000);
      }
    });

    return;
  },
  5, // time to wait before first execution in seconds
  10000 // interval in seconds
);

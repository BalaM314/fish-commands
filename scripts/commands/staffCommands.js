const players = require('./players');
const utils = require('./utils');
const menus = require('menus');
const config = require('config');
const ohno = require('ohno');

const registerCommands = (clientCommands, serverCommands, runner) => {
  // sus
  clientCommands.register(
    'sus',
    '<uwu>',
    'if you know, you know.',
    runner((args, realP) => {
      if (realP.admin) {
        const targetPlr = utils.plrByName(args[0]);

        if (!targetPlr) {
          realP.sendMessage('[scarlet]⚠ [yellow]Player not found.');
          return;
        }

        const targetP = players.getP(targetPlr);

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
    'warn a player.',
    runner((args, realP) => {
      const p = players.getP(realP);
      if (!p.admin && !p.mod) {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
        return;
      }
      const typedPlr = args[0];
      const reason = args[1];
      const targetPlr = utils.plrByName(typedPlr);

      if (!targetPlr) {
        realP.sendMessage('[scarlet]⚠ [yellow]Player "' + typedPlr + '[yellow]" not found.');
        return;
      }

      const tp = players.getP(targetPlr);

      if (tp.admin || tp.mod) {
        realP.sendMessage('[scarlet]⚠ [yellow] You cannot warn staff.');
        return;
      }

      const title = 'Warning';
      const message = reason
        ? reason
        : "You have been warned. I suggest you stop what you're doing";
      let options = [['accept']];

      Call.menu(targetPlr.con, menus.getMenus().listeners.warn, title, message, options);
    })
  );

  // Mute
  clientCommands.register(
    'mute',
    '[player(optional)]',
    'Toggle whether a player is muted or not.',
    runner((args, realP) => {
      const p = players.getP(realP);

      if (p.fakeAdmin) {
        return;
      }

      if (!p.mod && !p.admin) {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
        return;
      }

      if (args[0]) {
        const foundPlayer = utils.plrByName(args[0]);
        if (!foundPlayer) {
          realP.sendMessage('[scarlet]⚠ [yellow]Player "' + args[0] + '[yellow]" not found.');
          return;
        }
        const tp = players.getP(foundPlayer);

        tp.muted = !tp.muted;

        realP.sendMessage(foundPlayer.name + '[#48e076] was ' + (tp.muted ? 'muted.' : 'unmuted'));
        players.setName(foundPlayer);
        foundPlayer.sendMessage(
          tp.muted
            ? '[yellow] Hey! You have been muted. You can still use /msg to send a message to someone though.'
            : '[green]You have been unmuted.'
        );
        players.addPlayerHistory(foundPlayer.uuid(), {
          action: tp.muted ? 'muted' : 'unmuted',
          by: realP.name,
          time: Date.now(),
        });
        players.save();
        return;
      }
      // TODO - check if this works and updates the object in the other file
      menus.menuStuff.flattenedNonStaffPlayers = [];
      menus.menuStuff.lastOptionIndex = 0;

      const title = 'Mute';
      const message = 'Choose a player to mute/unmute.';
      let options = [[]];
      let arrayIndex = 0;
      Groups.player.forEach((pl) => {
        const pp = players.getP(pl);
        if (pp.mod || pp.admin) return;

        // TODO - see above todo
        menus.menuStuff.flattenedNonStaffPlayers.push(pl.uuid());

        if (options[arrayIndex].length >= 2) {
          arrayIndex += 1;
          menus.menuStuff.lastOptionIndex += 1;
          options[arrayIndex] = [pp.name];
          return;
        } else {
          menus.menuStuff.lastOptionIndex += 1;
          options[arrayIndex].push(pp.name);
          return;
        }
      });

      if (options[0].length === 0) options = [];

      options.push(['cancel']);

      Call.menu(realP.con, menus.getMenus().mute, title, message, options);
    })
  );

  // Kick
  clientCommands.register(
    'kick',
    '<player> [reason...]',
    'Kick a player with optional reason.',
    runner((args, realP) => {
      const p = players.getP(realP);

      if (p.fakeAdmin) {
        return;
      }

      if (p.admin || p.mod) {
        const typedPlr = args[0];
        const reason = args[1];
        const targetPlr = utils.plrByName(typedPlr);

        if (!targetPlr) {
          realP.sendMessage('[scarlet]⚠ "' + typedPlr + '"' + ' [yellow] was not found.');
          return;
        }

        const canKickPlr = !targetPlr.admin && !players.getP(targetPlr).mod;
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
      const p = players.getP(realP);

      if (p.fakeAdmin) {
        return;
      }

      if (!p.mod && !p.admin) {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
        return;
      }

      if (args[0]) {
        const foundPlayer = utils.plrByName(args[0]);
        if (!foundPlayer) {
          realP.sendMessage('[scarlet]⚠ [yellow]Player "' + args[0] + '[yellow]" not found.');
          return;
        }
        players.stop(foundPlayer);
        realP.sendMessage(foundPlayer.name + '[#48e076] was stopped.');
        return;
      }

      menus.menuStuff.flattenedNonStaffPlayers = [];
      menus.menuStuff.lastOptionIndex = 0;

      const title = 'Stop';
      const message = 'Choose a player to stop.';
      let options = [[]];
      let arrayIndex = 0;
      Groups.player.forEach((pl) => {
        const pp = players.getP(pl);
        if (pp.mod || pp.admin || pp.stopped) return;

        menus.menuStuff.flattenedNonStaffPlayers.push(pl.uuid());

        if (options[arrayIndex].length >= 2) {
          arrayIndex += 1;
          menus.menuStuff.lastOptionIndex += 1;
          options[arrayIndex] = [pl.name];
          return;
        } else {
          menus.menuStuff.lastOptionIndex += 1;
          options[arrayIndex].push(pl.name);
          return;
        }
      });

      if (options[0].length === 0) options = [];

      options.push(['cancel']);

      Call.menu(realP.con, menus.menuStuff.listeners.stop, title, message, options);
    })
  );

  // Free
  clientCommands.register(
    'free',
    '[player(optional)]',
    'free a player.',
    runner((args, realP) => {
      const p = players.getP(realP);
      if (!p.mod && !p.admin) {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
        return;
      }

      if (args[0]) {
        const foundPlayer = utils.plrByName(args[0]);
        if (!foundPlayer) {
          realP.sendMessage('[scarlet]⚠ [yellow]Player "' + args[0] + '[yellow]" not found.');
        } else if(!players.getP(foundPlayer).stopped){
          realP.sendMessage('[scarlet]⚠[yellow] ' + foundPlayer.name + ' is not stopped.');
        } else {
          players.free(foundPlayer);
          realP.sendMessage(foundPlayer.name + '[#48e076] was stopped.');
          return;
        }
      }

      menus.menuStuff.flattenedNonStaffPlayers = [];
      menus.menuStuff.lastOptionIndex = 0;

      const title = 'Free';
      const message = 'Choose a player to free.';
      let options = [[]];
      let arrayIndex = 0;
      Groups.player.forEach((pl) => {
        const pp = players.getP(pl);
        if (!pp.stopped) return;
        //Only show stopped players

        menus.menuStuff.flattenedNonStaffPlayers.push(pl.uuid());

        if (options[arrayIndex].length >= 2) {
          arrayIndex += 1;
          menus.menuStuff.lastOptionIndex += 1;
          options[arrayIndex] = [pl.name];
          return;
        } else {
          menus.menuStuff.lastOptionIndex += 1;
          options[arrayIndex].push(pl.name);
          return;
        }
      });

      if (options[0].length === 0) options = [];

      options.push(['cancel']);

      Call.menu(realP.con, menus.menuStuff.listeners.free, title, message, options);
    })
  );

  // Mod
  clientCommands.register(
    'mod',
    '<add/remove> <player>',
    "add or remove a player's mod status.",
    runner((args, realP) => {
      const p = players.getP(realP);
      if (p.admin) {
        const action = args[0];
        const typedPlr = args[1];
        const targetPlr = utils.plrByName(typedPlr);

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

        const tp = players.getP(targetPlr);

        const canAddPlr = !tp.mod && !tp.admin;
        // const canAddPlr = true;
        if (action === 'add' && !canAddPlr) {
          realP.sendMessage('[scarlet]⚠ ' + targetPlr.name + ' [yellow]is already a staff member.');
          return;
        }

        if (action === 'add') {
          tp.mod = true;
          realP.sendMessage(targetPlr.name + '[#48e076] is now ranked Moderator.');
          targetPlr.sendMessage(
            '[yellow] Your rank is now [#48e076]Moderator.[yellow] Use [acid]"/help mod"[yellow] to see available commands.'
          );
          players.setName(targetPlr);
          players.save();
          return;
        }

        const canRemovePlr = tp.mod;
        if (action === 'remove' && !canRemovePlr) {
          realP.sendMessage('[scarlet]⚠ ' + targetPlr.name + ' [yellow]is not a Moderator.');
          return;
        }

        if (action === 'remove') {
          tp.mod = false;
          realP.sendMessage(targetPlr.name + '[#48e076] just got demoted to player.');
          players.setName(targetPlr);
          players.save();
          return;
        }
      } else {
        realP.sendMessage('[scarlet]You do not have access to this command.');
        return;
      }
    })
  );

  // Admin // TEST WITH OTHER PLAYERS
  clientCommands.register(
    'admin',
    '<add/remove> <player>',
    "add or remove a player's admin status.",
    runner((args, realP) => {
      const p = players.getP(realP);
      if (p.admin) {
        const action = args[0];
        const typedPlr = args[1];
        const targetPlr = utils.plrByName(typedPlr);

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

        const canAddPlr = !players.getP(targetPlr).admin;
        if (action === 'add' && !canAddPlr) {
          realP.sendMessage('[scarlet]⚠ ' + targetPlr.name + ' [yellow]is already an admin.');
          return;
        }

        if (action === 'add') {
          players.getP(targetPlr).admin = true;
          targetPlr.admin = true;
          serverCommands.handleMessage('admin add ' + targetPlr.uuid());
          realP.sendMessage(targetPlr.name + '[#48e076] is now ranked Admin.');
          targetPlr.sendMessage(
            '[yellow] Your rank is now [#514ced]Admin.[yellow] Use [sky]"/help admin"[yellow] to see available commands.'
          );
          players.setName(targetPlr);
          players.save();
          return;
        }

        const canRemovePlr = players.getP(targetPlr).admin;
        if (action === 'remove' && !canRemovePlr) {
          realP.sendMessage('[scarlet]⚠ ' + targetPlr.name + ' [yellow]is not an Admin.');
          return;
        }

        if (action === 'remove') {
          players.setName(targetPlr);
          players.getP(targetPlr).admin = false;
          targetPlr.admin = false;
          serverCommands.handleMessage('admin remove ' + targetPlr.uuid());
          realP.sendMessage(targetPlr.name + '[#48e076] just got demoted to player.');
          players.save();
          return;
        }
      } else {
        realP.sendMessage('[scarlet]You do not have access to this command.');
        return;
      }
    })
  );

  // Murder
  clientCommands.register(
    'murder',
    'Kills all ohno units',
    runner((args, realP) => {
      const p = players.getP(realP);
      if (p.admin || p.mod) {
        const killed = ohno.totalOhno();
        ohno.killOhno();
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

  // unmuteall
  clientCommands.register(
    'unmuteall',
    'unmute all muted players.',
    runner((args, realP) => {
      const p = players.getP(realP);
      if (p.admin || p.mod) {
        const allIds = players.getAllIds();
        allIds.forEach((id) => {
          const targetPlr = utils.plrById(id);
          if (!targetPlr) return;
          if (players[id].muted) {
            players[id].muted = false;
            players.setName(targetPlr);
          }
        });
        realP.sendMessage('[#48e076]All players have the ability to speak.');
      } else {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have permission to use this command.');
      }
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

        const restartMessage = (sec) => {
          if (sec === 5) {
            Call.sendMessage('[green]Game saved. [scarlet]Server restarting in:');
          }

          Call.sendMessage('[scarlet]' + String(sec));

          if (sec <= 0) {
            Core.app.post(() => {
              SaveIO.save(file);
              Core.app.exit();
            });
            return;
          }
          Timer.schedule(() => {
            const newSec = sec - 1;
            restartMessage(newSec);
          }, 1);
        };
        restartMessage(5);
      }
    })
  );

  // history
  clientCommands.register(
    'history',
    '<player>',
    'Show moderation history for a player.',
    runner((args, realP) => {
      const p = players.getP(realP);

      if (!p.admin && !p.mod) {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
        return;
      }

      const targetP = utils.plrByName(args[0]);
      if (!targetP) {
        realP.sendMessage(
          '[scarlet]⚠ [yellow]No player was found containing ' + '"' + args[0] + '".'
        );
        return;
      }

      const tp = players.getP(targetP);
      if (!tp.history || !tp.history.length) {
        realP.sendMessage('[yellow]No history was found for ' + tp.name + '[yellow].');
        return;
      }
      let message = ['[yellow]_______________Player history_______________\n\n'];

      tp.history.forEach((h) => {
        message.push(
          h.by +
            ' [yellow]' +
            h.action +
            ' ' +
            tp.name +
            ' [white]' +
            utils.getTimeSinceText(h.time)
        );
      });

      realP.sendMessage(message.join('\n'));
      return;
    })
  );

  // save
  clientCommands.register(
    'save',
    'saves the game state.',
    runner((args, realP) => {
      const p = players.getP(realP);
      if (!p.admin && !p.mod) {
        realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
        return;
      }

      players.save();
      const file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
      SaveIO.save(file);
      realP.sendMessage('[green]Game saved.');
      return;
    })
  );

  // wave
  clientCommands.register(
    'wave',
    '<number>',
    'sets the wave number.',
    runner((args, realP) => {
      const p = players.getP(realP);

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

  // label
  clientCommands.register(
    'label',
    '<time> <message...>',
    'places a label at your position for designated length of time.',

    runner((args, player) => {
      const message = args[1];

      const labelx = player.x;
      const labely = player.y;

      let labeltime = Number(args[0]);

      const playername = player.name;

      if (player.admin) {
        if (labeltime < 3600) {
          let timeseconds = labeltime % 60;
          let timeminutes1 = labeltime - timeseconds;
          let timeminutes2 = timeminutes1 / 60;

          Timer.schedule(
            () => {
              if (labeltime > 0) {
                Call.label(
                  playername +
                    '\n\n[white]' +
                    message +
                    '\n\n[acid]' +
                    timeminutes2 +
                    ':' +
                    timeseconds,
                  1,
                  labelx,
                  labely
                );
              } else {
                return;
              }
            },
            0,
            1,
            labeltime
          );

          Timer.schedule(
            () => {
              timeseconds = labeltime % 60;
              timeminutes1 = labeltime - timeseconds;
              timeminutes2 = timeminutes1 / 60;

              labeltime = labeltime - 1;
            },
            0,
            1,
            labeltime
          );

          return;
        } else {
          player.sendMessage('[red]Maximum time is 3600 seconds :)');
          return;
        }
      } else {
        player.sendMessage('[red]You dont have access to this command');
        return;
      }
    })
  );

  // member
  clientCommands.register(
    'member',
    '<add/remove> <player>',
    "change a player's member status.",
    runner((args, realP) => {
      if (!realP.admin) {
        realP.sendMessage('[yellow]You must be an admin to use this command.');
        return;
      }
      const targetPlr = utils.plrByName(args[1]);
      if (!targetPlr) {
        realP.sendMessage('[yellow]Player not found.');
        return;
      }

      if (!['add', 'remove'].includes(args[0])) {
        realP.sendMessage('[yellow]You must type "add" or "remove"');
        return;
      }

      const tp = players.getP(targetPlr);

      tp.member = args[0] === 'add' ? true : false;
      players.setName(targetPlr);
      players.save();
      realP.sendMessage(tp.name + "[green]'s member status set to " + String(tp.member));
    })
  );

  // ipban
  clientCommands.register(
    'ipban',
    'Choose a player to ban by ip',
    runner((args, realP) => {
      if (!realP.admin) {
        realP.sendMessage('[yellow]You must be an admin to use this command.');
        return;
      }

      menus.menuStuff.flattenedNonStaffPlayers = [];
      menus.menuStuff.lastOptionIndex = 0;

      const title = 'IP BAN';
      const message = 'Choose a player to IP ban.';
      let options = [[]];
      let arrayIndex = 0;
      Groups.player.forEach((pl) => {
        const pp = players.getP(pl);
        if (pp.mod || pp.admin) return;

        menus.menuStuff.flattenedNonStaffPlayers.push(pl.uuid());

        if (options[arrayIndex].length >= 2) {
          arrayIndex += 1;
          menus.menuStuff.lastOptionIndex += 1;
          options[arrayIndex] = [pl.name];
          return;
        } else {
          menus.menuStuff.lastOptionIndex += 1;
          options[arrayIndex].push(pl.name);
          return;
        }
      });

      if (options[0].length === 0) options = [];

      options.push(['cancel']);

      Call.menu(realP.con, menus.menuStuff.listeners.ipban, title, message, options);
    })
  );
};

// const p = players.getP(realP);
module.exports = {
  registerCommands: registerCommands,
};

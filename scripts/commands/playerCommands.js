const players = require('./players');
const utils = require('./utils');
const menus = require('./menus');
const ohno = require('ohno');
const config = require('config');

let trails = [];

const tp = (plr, p2) => {
  plr.unit().set(p2.unit().x, p2.unit().y);
  Call.setCameraPosition(plr.con, plr.unit().x, plr.unit().y);
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
    if (
      [107, 105, 109, 106, 111, 108, 112, 117, 115, 116, 110, 125, 124, 103, 113, 114].includes(
        t.block().id
      )
    ) {
      t.setNet(Blocks.air, Team.sharded, 0);
    }
  });
};

const messageStaff = (name, msg) => {
  const message = `[gray]<[cyan]staff[gray]>[white]` + name + `[green]: [cyan]` + msg;
  Groups.player.forEach((pl) => {
    if (pl.admin) {
      pl.sendMessage(message);
      return;
    }
    const p = players.getP(pl);
    if (!p.mod) return;
    pl.sendMessage(message);
    return;
  });
};

const registerCommands = (clientCommands, runner) => {
  // tp
  clientCommands.register(
    'tp',
    '<player>',
    'teleport to another player.',
    runner((args, realP) => {
      const otherPlr = utils.plrByName(args[0]);
      if (!otherPlr) {
        realP.sendMessage(
          '[scarlet]⚠ [yellow]No player found containing "' + args[0] + '[yellow].'
        );
        return;
      }
      tp(realP, otherPlr);
    })
  );

  // clean
  clientCommands.register(
    'clean',
    'clear the map of boulders.',
    runner((args, realP) => {
      clean(realP.con);
    })
  );

  // Kill
  clientCommands.register(
    'kill',
    'commit die.',
    runner((args, realP) => {
      const p = players.getP(realP);
      if (p.fakeAdmin) {
        return;
      }
      realP.unit().kill();
    })
  );

  // Discord
  clientCommands.register(
    'discord',
    'takes you to our discord :)',
    runner((args, realP) => {
      Call.openURI(realP.con, 'https://discord.gg/VpzcYSQ33Y');
    })
  );

  // Tilelog
  clientCommands.register(
    'tilelog',
    'check recent build history of a tile.',
    runner((args, realP) => {
      const p = players.getP(realP);
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
      const p = players.getP(realP);
      if (p.afk) {
        p.afk = false;
        players.setName(realP);
        realP.sendMessage('[yellow] You are no longer AFK.');
        return;
      }
      p.afk = true;
      players.setName(realP);
      realP.sendMessage('[yellow] You are marked as AFK.');
      return;
    })
  );

  // tileid
  clientCommands.register(
    'tileid',
    'check id of a tile',
    runner((args, realP) => {
      const p = players.getP(realP);
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

  // help
  clientCommands.register(
    'help',
    '[page]',
    'shows the help page.',
    runner((args, realP) => {
      const filter = {
        member: ['pet', 'highlight', 'rainbow', 'bc'],
        mod: ['warn', 'mute', 'kick', 'stop', 'free', 'murder', 'unmuteall', 'history', 'save'],
        admin: [
          'sus',
          'admin',
          'mod',
          'wave',
          'restart',
          'forcertv',
          'spawn',
          'exterminate',
          'label',
          'member',
          'ipban',
        ],
      };

      let normalCommands = [];
      const modCommands = [];
      const adminCommands = [];
      const memberCommands = [];

      clientCommands.getCommandList().forEach((c) => {
        let tempCmd = '/' + c.text + ' ';
        if (c.paramText) tempCmd += '[white]' + c.paramText + ' ';
        tempCmd += '[lightgrey]- ' + c.description;

        if (filter.member.includes(c.text)) {
          memberCommands.push('[pink]' + tempCmd);
          return;
        }

        if (filter.mod.includes(c.text)) {
          modCommands.push('[acid]' + tempCmd);
          return;
        }
        if (filter.admin.includes(c.text)) {
          adminCommands.push('[cyan]' + tempCmd);
          return;
        }
        normalCommands.push('[sky]' + tempCmd);
        return;
      });

      const page = args[0];

      if (page === 'admin') {
        realP.sendMessage('[cyan]--Admin commands--\n' + adminCommands.join('\n'));
        return;
      }

      if (page === 'mod') {
        realP.sendMessage('[acid]--Mod commands--\n' + modCommands.join('\n'));
        return;
      }

      if (page === 'member') {
        realP.sendMessage('[pink]--Member commands--\n' + memberCommands.join('\n'));
        return;
      }

      normalCommands = utils.createChuncks(normalCommands, 15);

      if (!page) {
        realP.sendMessage(
          '[sky]--Commands page [lightgrey]1/' +
            normalCommands.length +
            ' [sky]--\n' +
            normalCommands[0].join('\n')
        );
        return;
      }

      const pageNumber = Number(page);
      if (pageNumber === 'NaN' || !pageNumber) {
        realP.sendMessage('[scarlet]⚠ [yellow]"' + page + '" is an invalid page number.');
        return;
      }

      if (pageNumber > normalCommands.length) {
        realP.sendMessage(
          '[sky]--Commands page [lightgrey]' +
            normalCommands.length +
            '/' +
            normalCommands.length +
            '[sky]--'
        );
        realP.sendMessage(normalCommands[normalCommands.length - 1].join('\n'));
        return;
      }

      realP.sendMessage(
        '[sky]--Commands page [lightgrey]' + pageNumber + '/' + normalCommands.length + '[sky]--'
      );
      realP.sendMessage(normalCommands[pageNumber - 1].join('\n'));
      return;
    })
  );

  // staff chat
  clientCommands.register(
    's',
    '<message...>',
    'sends a message only to staff.',
    runner((args, realP) => {
      messageStaff(realP.name, args[0]);
      return;
    })
  );

  // watch
  clientCommands.register(
    'watch',
    '[player]',
    'watch a player.',
    runner((args, realP) => {
      const p = players.getP(realP);
      if (p.watch) {
        p.watch = false;
        return;
      }
      const target = utils.plrByName(args[0]);
      if (!target) {
        realP.sendMessage('[yellow]Player not found.');
        return;
      }

      p.watch = true;
      /**
       * This command is mostly for mobile (or players without foos).
       *
       * Since the player's unit follows the camera and we are moving the
       * camera, we need to keep setting the players real position to the
       * spot the command was made. This is pretty buggy but otherwise the
       * player will be up the target player's butt
       */

      const stayX = realP.unit().x;
      const stayY = realP.unit().y;

      const watch = () => {
        if (p.watch) {
          // Self.X+(172.5-Self.X)/10
          Call.setCameraPosition(realP.con, target.unit().x, target.unit().y);
          realP.unit().set(stayX, stayY);
          Timer.schedule(
            () => {
              watch();
            },
            0.1,
            0.1,
            0
          );
          return;
        } else {
          Call.setCameraPosition(realP.con, stayX, stayY);
          return;
        }
      };

      watch();
    })
  );
};

// const p = players.getP(realP);
module.exports = {
  registerCommands: registerCommands,
};

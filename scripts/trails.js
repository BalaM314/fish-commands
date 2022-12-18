const players = require('./players');
const utils = require('utils');

let trails = [];

const getTrails = () => trails;

const registerCommands = (clientCommands, runner) => {
  // trail
  clientCommands.register(
    'trail',
    '[type] [color/#hex/r,g,b]',
    'Use command to see options and toggle trail on/off.',
    runner((args, realP) => {
      const p = players.getP(realP);

      if (!args[0]) {
        if (trails.includes(realP.uuid())) {
          trails = trails.filter((id) => id !== realP.uuid());
          p.trail = null;
        }
        const options = [
          '1 - fluxVapor (flowing smoke, long lasting)',
          '2 - overclocked (diamonds)',
          '3 - overdriven (squares)',
          '4 - shieldBreak (smol)',
          '5 - upgradeCoreBloom (square, long lasting, only orange)',
          '6 - electrified (tiny spiratic diamonds, but only green)',
          '7 - unitDust (same as above but round, and can change colors)',
          '[white]Usage: [orange]/trail [lightgrey]<type> [color/#hex/r,g,b]',
        ];
        realP.sendMessage(
          '[green]Trail turned off. Available types:[yellow]\n' + options.join('\n')
        );
        return;
      } else {
        const types = {
          1: 'fluxVapor',
          2: 'overclocked',
          3: 'overdriven',
          4: 'shieldBreak',
          5: 'upgradeCoreBloom',
          6: 'electrified',
          7: 'unitDust',
        };

        if (!Object.keys(types).includes(args[0])) {
          realP.sendMessage('"' + args[0] + '" is not an available type.');
          return;
        }

        if (!args[1]) {
          p.trail = {
            type: types[args[0]],
            color: Color['white'],
          };
          if (!trails.includes(realP.uuid())) {
            trails.push(realP.uuid());
          }
        } else {
          const valid = typeof Color['pink'];

          const typedColor = args[1];

          try {
            if (typedColor.includes(',')) {
              let formattedColor = typedColor.split(',');
              const col = {
                r: Number(formattedColor[0]),
                g: Number(formattedColor[1]),
                b: Number(formattedColor[2]),
                a: 255,
              };

              p.trail = {
                type: types[args[0]],
                color: new Color(Color.abgr(col.a, col.b, col.g, col.r)),
              };
            } else if (typedColor.includes('#')) {
              p.trail = {
                type: types[args[0]],
                color: Color.valueOf(typedColor),
              };
            } else if (typeof Color[typedColor] === valid) {
              p.trail = {
                type: types[args[0]],
                color: Color[typedColor],
              };
            } else {
              realP.sendMessage(
                '[scarlet]Sorry, "' +
                  args[1] +
                  '" is not a valid color.\n[yellow]Color can be in the following formats:\n[pink]pink [white]| [gray]#696969 [white]| 255,0,0.'
              );
              return;
            }

            trails.push(realP.uuid());
            return;
          } catch (e) {
            realP.sendMessage(
              '[scarlet]Sorry, "' +
                args[1] +
                '" is not a valid color.\nColor can be in the following formats:\npink | #696969 | 255,0,0.'
            );
            return;
          }
        }
      }

      return;
    })
  );
};

// trails
Timer.schedule(
  () => {
    trails.forEach((id) => {
      const pl = utils.plrById(id);
      if (!pl) return;
      const p = players.getP(pl);
      if (!p.trail) return;
      Call.effect(Fx[p.trail.type], pl.x, pl.y, 0, p.trail.color);
    });
  },
  5,
  0.15
);

module.exports = {
  registerCommands: registerCommands,
  getTrails: getTrails,
};

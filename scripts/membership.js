const { FishPlayer } = require('players');
const utils = require('utils');
const trails = require('trails');

const registerCommands = (clientCommands, runner) => {
  // pet
  clientCommands.register(
    'pet',
    '[name...]',
    'spawns a cool pet with a displayed name that follows you around.',

    runner((args, player) => {
      const p = FishPlayer.get(player);
      if (!p.member) {
        player.sendMessage(
          '[scarlet]⚠ [yellow]You must have a [scarlet]Fish Membership[yellow] to use this command. Subscribe on the [sky]/discord[yellow] !'
        );
        return;
      }
      if (!args[0]) {
        const temp = Groups.unit.find((u) => u.id === p.pet);
        if (temp) temp.kill();
        p.pet = '';
        return;
      }
      if (p.pet !== '') {
        const temp = Groups.unit.find((u) => u.id === p.pet);
        if (temp) temp.kill();
        p.pet = '';
      }

      const petname = args[0];
      const existing = [];
      Groups.unit.forEach((u) => {
        if (u.type === UnitTypes.merui) {
          existing.push(u.id);
        }
      });

      UnitTypes.merui.spawn(player.team(), player.unit().x, player.unit().y);

      const spawnedUnit = Groups.unit.find(
        (u) => u.type === UnitTypes.merui && !existing.includes(u.id)
      );

      spawnedUnit.apply(StatusEffects.disarmed, 10000);
      p.pet = spawnedUnit.id;

      Call.infoPopup('[#7FD7FD7f]', 5, Align.topRight, 180, 0, 0, 10);

      const controlUnit = (props) => {
        return Timer.schedule(() => {
          if (props.su.id !== props.p.pet || !utils.plrById(props.player.uuid())) {
            props.su.kill();
            return;
          }
          const tempX = props.player.unit().x - props.su.x;
          const tempY = props.player.unit().y - props.su.y;
          if (tempX >= 50 || tempX <= -50 || tempY >= 50 || tempY <= -50) {
            props.su.approach(new Vec2(tempX, tempY));
          }
          Call.label(props.pn, 0.07, props.su.x, props.su.y + 5);
          if (trails.getTrails().includes(props.player.uuid())) {
            Call.effect(Fx[props.p.trail.type], props.su.x, props.su.y, 0, props.p.trail.color);
          }
          controlUnit({ pn: props.pn, su: props.su, player: props.player, p: props.p });
        }, 0.05);
      };
      controlUnit({ pn: petname, su: spawnedUnit, player: player, p: p });
    })
  );

  // highlight
  clientCommands.register(
    'highlight',
    '<color>',
    'make your chat text colored by default.',
    runner((args, realP) => {
      const p = FishPlayer.get(realP);
      if (!p.member) {
        realP.sendMessage(
          '[scarlet]⚠ [yellow]You must have a [scarlet]Fish Membership[yellow] to use this command. Subscribe on the [sky]/discord[yellow] !'
        );
        return;
      }

      if (Strings.stripColors(args[0]) !== '') {
        realP.sendMessage('[yellow]"' + args[0] + '[yellow]" was not a valid color!');
        return;
      }

      p.highlight = args[0];
      return;
    })
  );

  // rainbow name
  clientCommands.register(
    'rainbow',
    '[speed]',
    'make your name change colors.',

    runner((args, player) => {
      const p = FishPlayer.get(player);

      if (!p.member) {
        player.sendMessage(
          '[scarlet]⚠ [yellow]You must have a [scarlet]Fish Membership[yellow] to use this command. Subscribe on the [sky]/discord[yellow] !'
        );
        return;
      }
      const speed = args[0];

      if (!speed) {
        p.updateName();
        p.rainbow = null;
        return;
      }

      if (speed > 10) {
        player.sendMessage('[red]Speed must be a number between 1 and 10.');
        return;
      }

      if (speed < 0) {
        player.sendMessage('[red]Speed must be a number between 1 and 10.');
        return;
      } else {
        const speed2 = speed / 5;
        if (!p.rainbow) {
          p.rainbow = {
            speed: speed,
          };
        }

        const colorName = (ind, _p) => {
          const colors = ['[red]', '[orange]', '[yellow]', '[acid]', '[blue]', '[purple]'];

          Timer.schedule(() => {
            if (!_p.rainbow) return;
            player.name = colors[ind % colors.length] + Strings.stripColors(p.name);
            colorName(ind + 1, _p);
          }, speed2);
        };
        colorName(0, p);
      }
    })
  );
};

module.exports = {
  registerCommands: registerCommands,
};

const utils = require("utils");

let ohnoSpawnOverride = false;
let ohnos = [];

const totalOhno = () => {
  return ohnos.length;
};

const canSpawnOhno = () => {
  if (ohnoSpawnOverride) {
    return false;
  }
  const totalPlayers = Groups.player.size();
  return ohnos.length < totalPlayers;
};

const ohno = (p) => {
  if (!canSpawnOhno()) {
    p.sendMessage('[scarlet]⚠[yellow]Sorry, the max number of ohno units has been reached.');
    return;
  }
  if (utils.nearbyEnemyTile(p.unit(), 6) != null) {
    p.sendMessage('[scarlet]⚠[yellow]Too close to an enemy tile!');
    return;
  }

  const targetUnit = UnitTypes.atrax.spawn(p.team(), p.unit().x, p.unit().y); // spawn unit at player's position

  targetUnit.type = UnitTypes.alpha; // change the type to make an ohno unit
  targetUnit.apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
  // targetUnit.spawnedByCore = true; //Disable the death explosion -- this doesn't work
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

const registerCommands = (clientCommands, runner) => {
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
};

module.exports = {
  ohno: ohno,
  killOhno: killOhno,
  totalOhno: totalOhno,
  registerCommands: registerCommands,
};

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

// disable ohnos
Timer.schedule(
  () => {
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

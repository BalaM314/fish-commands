const menuStuff = {
  listeners: {},
  flattenedNonStaffPlayers: [],
  lastOptionIndex: 0,
};

// Menus
const stopListener = (player, option) => {
  if (option === -1 || option === menuStuff.lastOptionIndex) return;

  const p = players[menuStuff.flattenedNonStaffPlayers[option]];
  const pObj = plrById(menuStuff.flattenedNonStaffPlayers[option]);

  stopPlr(pObj, player);
  player.sendMessage(pObj.name + '[#48e076] was stopped.');
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

// warn menu
const warnListener = (player, option) => {
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

Events.on(ServerLoadEvent, (e) => {
  menuStuff.listeners.stop = Menus.registerMenu(stopListener);
  menuStuff.listeners.mute = Menus.registerMenu(muteListener);
  menuStuff.listeners.warn = Menus.registerMenu(warnListener);
});

const getMenus = () => {
  return menuStuff.listeners;
};
module.exports = {
  menuStuff: menuStuff,
  getMenus: getMenus,
};

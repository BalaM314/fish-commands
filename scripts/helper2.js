const players = require('players');
const old = {};

const logg = (msg) => Call.sendMessage(msg);
const list = (ar) => Call.sendMessage(ar.join(' | '));
const keys = (obj) => Call.sendMessage(Object.keys(obj).join(' [scarlet]|[white] '));

const memoize = (callback, dep, id) => {
  if (!old[id]) {
    old[id] = { value: callback(), dep: dep };
    return old[id].value;
  }

  let valueHasChanged = false;

  dep.forEach((d, ind) => {
    if (d !== old[id].dep[ind]) {
      valueHasChanged = true;
    }
  });

  if (valueHasChanged) {
    const newVal = callback();
    old[id].value = newVal;
    old[id].dep = dep;
    return callback();
  } else {
    return old[id].value;
  }
};

const createChuncks = (arr, chunkSize) => {
  const copyArr = [];
  arr.forEach((i) => copyArr.push(i));
  const newArr = [];
  while (copyArr.length > 0) {
    newArr.push(copyArr.splice(0, chunkSize));
  }
  return newArr;
};

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

module.exports = {
  log: logg,
  list: list,
  keys: keys,
  memoize: memoize,
  createChuncks: createChuncks,
  plrById: plrById,
  plrByName: plrByName,
};

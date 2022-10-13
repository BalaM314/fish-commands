const old = {};
const logg = (msg) => Call.sendMessage(msg);
const list = (ar) => Call.sendMessage(ar.join(' | '));
const keys = (obj) => Call.sendMessage(Object.keys(obj).join(' [scarlet]|[white] '));
const info = (msg) => Call.infoMessage(msg);

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

module.exports = {
  log: logg,
  list: list,
  keys: keys,
  info: info,
  memoize: memoize,
};

const old = {};

const logg = (msg) => Call.sendMessage(msg);
const list = (ar) => Call.sendMessage(ar.join(' | '));
const keys = (obj) => Call.sendMessage(Object.keys(obj).join(' [scarlet]|[white] '));

/**
 * Stores the output of a function and returns that value
 * instead of running the function again unless any
 * dependencies have changed to improve performance with
 * functions that have expensive computation.
 * @param {function} callback function to run if a dependancy has changed
 * @param {array} dep dependency array of values to monitor
 * @param {number | string} id arbitrary unique id of the function for storage purposes.
 */
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

/**
 * Splits an array into a multidimensional array with equal sizes.
 * @param {array} arr the array to split
 * @param {number} chunkSize the item limit each "inner" array should contain
 * @example
 * const myArr = ['item1', 'item2', 'item3', 'item4', 'item5'];
 *
 * const splitArr = createChunks(myArr, 2); // [['item1', 'item2'], ['item3', 'item4'], ['item5']]
 */
const createChunks = (arr, chunkSize) => {
  const copyArr = [];
  arr.forEach((i) => copyArr.push(i));
  const newArr = [];
  while (copyArr.length > 0) {
    newArr.push(copyArr.splice(0, chunkSize));
  }
  return newArr;
};

/**
 * Returns the amount of time passed since the old time in a readable format
 * @param {number} old
 */
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

/**
 * Get an online player by name. May return null.
 * @param {string} plr
 */
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

/**
 * Get an online player by uuid.
 * @param {string} plr
 */
const plrById = (id) => Groups.player.find((p) => p.uuid() === id);

module.exports = {
  log: logg,
  list: list,
  keys: keys,
  memoize: memoize,
  createChunks: createChunks,
  plrById: plrById,
  plrByName: plrByName,
  getTimeSinceText: getTimeSinceText,
};

const utils = require('utils');
const players = require('players');

// AutoSave;
Timer.schedule(
  () => {
    const file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);

    Core.app.post(() => {
      SaveIO.save(file);
      Call.sendMessage('[#4fff8f9f]Game saved.');
    });
  },
  10,
  300
);

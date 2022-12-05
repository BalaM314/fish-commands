const players = require('players');
const utils = require('helper2');

let whisper = {};

const registerCommands = (clientCommands, runner) => {
  // Msg
  clientCommands.register(
    'msg',
    '<player> <message...>',
    'send a private message to a player.',
    runner((args, realP) => {
      const p = players.getP(realP);
      const typedPlr = args[0];
      const targetPlr = utils.plrByName(typedPlr);
      if (!targetPlr) {
        realP.sendMessage('[scarlet]⚠ "' + typedPlr + '"' + ' [yellow] was not found.');
        return;
      }

      const dm = args[1];

      if (!dm || !dm.length || dm === '') {
        realP.sendMessage(
          '[scarlet]⚠ [yellow]You must type a message to send. Usage: [white]"/msg <player> <message>"'
        );
        return;
      }

      const pid = realP.uuid();
      const tid = targetPlr.uuid();

      if (!whisper[tid]) whisper[tid] = { from: pid };
      if (!whisper[tid].from || whisper[tid].from !== pid) whisper[tid] = { from: pid };

      targetPlr.sendMessage(realP.name + '[lightgray] whispered:[#0ffffff0] ' + dm);
      realP.sendMessage('[#0ffffff0]Message sent to ' + targetPlr.name + '[#0ffffff0].');
      return;
    })
  );

  // Reply
  clientCommands.register(
    'r',
    '<message...>',
    'reply to most recent message.',
    runner((args, realP) => {
      const p = players.getP(realP);
      const pid = realP.uuid();

      const dm = args[0];
      if (!dm) {
        realP.sendMessage(
          '[scarlet]⚠ You must type a message to send. Usage: [white]"/r <message>"'
        );
        return;
      }

      if (!whisper[pid] || !whisper[pid].from) {
        realP.sendMessage(
          `[scarlet]⚠ [yellow]It doesn't look like someone has messaged you recently.. Try whispering to them with [white]"/msg <player> <message>"`
        );
        return;
      }

      const targetPlr = utils.plrById(whisper[pid].from);
      const tid = targetPlr.uuid();

      targetPlr.sendMessage(realP.name + '[lightgray] whispered:[#0ffffff0] ' + dm);
      realP.sendMessage('[#0ffffff0]Message sent to ' + targetPlr.name + '[#0ffffff0].');
      if (!whisper[tid]) {
        whisper[tid] = { from: pid };
        return;
      } else {
        whisper[tid].from = pid;
        return;
      }
    })
  );
};

module.exports = {
  registerCommands: registerCommands,
};

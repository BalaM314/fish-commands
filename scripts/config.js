const STOPPED_PREFIX = '[yellow]\u26A0[scarlet]Marked Griefer[yellow]\u26A0[white]';
const ADMIN_PREFIX = '[black]<[scarlet]A[black]>';
const MOD_PREFIX = '[black]<[green]M[black]>';
const AFK_PREFIX = '[orange]\uE876 AFK \uE876 | [white]';
const MUTED_PREFIX = '[white](muted)';
const MEMBER_PREFIX = '[black]<[yellow]\uE809[black]>[white]';
const bannedWords = ['nigger', 'kill yourself', 'kill urself', 'kys', 'cock', 'cock sucker'];
const bannedNames = ['goldberg', 'eshay'];

// const ip = 'localhost';
const ip = '45.79.202.111';

module.exports = {
  STOPPED_PREFIX: STOPPED_PREFIX,
  ADMIN_PREFIX: ADMIN_PREFIX,
  MOD_PREFIX: MOD_PREFIX,
  AFK_PREFIX: AFK_PREFIX,
  MUTED_PREFIX: MUTED_PREFIX,
  MEMBER_PREFIX: MEMBER_PREFIX,
  bannedWords: bannedWords,
  ip: ip,
  bannedNames: bannedNames,
};

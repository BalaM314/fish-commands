const STOPPED_PREFIX = '[yellow]⚠[scarlet]Marked Griefer[yellow]⚠[white]';
const ADMIN_PREFIX = '[black]<[scarlet]A[black]>';
const MOD_PREFEIX = '[black]<[green]M[black]>';
const AFK_PREFIX = '[orange] AFK  | [white]';
const MUTED_PREFIX = '[white](muted)';
const MEMBER_PREFIX = '[black]<[yellow][black]>[white]';
const bannedWords = ['nigger', 'kill yourself', 'kill urself', 'kys', 'cock', 'cock sucker'];
const bannedNames = ['goldberg', 'eshay'];

// const ip = 'localhost';
const ip = '45.79.202.111';

module.exports = {
  STOPPED_PREFIX: STOPPED_PREFIX,
  ADMIN_PREFIX: ADMIN_PREFIX,
  MOD_PREFEIX: MOD_PREFEIX,
  AFK_PREFIX: AFK_PREFIX,
  MUTED_PREFIX: MUTED_PREFIX,
  MEMBER_PREFIX: MEMBER_PREFIX,
  bannedWords: bannedWords,
  ip: ip,
  bannedNames: bannedNames,
};

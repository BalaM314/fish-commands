const utils = require('helper');
importPackage(Packages.arc);

let votes = {};
let voteOngoing = false;
let alreadyVoted = [];
let voteStartTime = 0;
const voteTime = 1.5 * 60000; // 1.5 mins
let voteChangesMap = false;
let serverCommands;

const resetVotes = () => {
  alreadyVoted = [];
  voteStartTime = 0;
  voteOngoing = false;
  const maps = Vars.maps.customMaps().toArray();
  votes = {};
  for (let i = 0; i < maps.length; i++) {
    votes[i] = {
      name: maps[i].name(),
      total: 0,
    };
  }
};

const startVoteTimer = () => {
  voteOngoing = true;
  voteStartTime = Date.now();
  Timer.schedule(() => {
    if (!voteOngoing) return;
    let highestVotedMap = [];
    let highestVotes = 0;

    const maps = Object.keys(votes);
    maps.forEach((map) => {
      const vote = votes[map];
      if (vote.total > highestVotes) {
        highestVotes = vote.total;
        highestVotedMap = [map];
        return;
      }

      if (vote.total === highestVotes) {
        highestVotedMap.push(map);
        return;
      }
    });

    if (highestVotedMap.length > 1) {
      const votedMapNames = [];
      maps.forEach((num) => {
        if (votes[num].total > 0) {
          votedMapNames.push('[cyan]' + votes[num].name + '[yellow]: ' + votes[num].total);
        }
      });

      const winner = votes[highestVotedMap[Math.floor(Math.random() * highestVotedMap.length)]];

      Call.sendMessage(
        '[green]There was a tie between the following maps: \n' +
          '[yellow]' +
          votedMapNames.join('[green],\n[yellow]') +
          '\n[green]Picking random winner: [yellow]' +
          winner.name
      );
      serverCommands.handleMessage('nextmap ' + winner.name.split(' ').join('_'));
      resetVotes();
      if (voteChangesMap) {
        Call.sendMessage('[green]Changing map.');
        Events.fire(new GameOverEvent(Team.crux));
      }
      return;
    }

    Call.sendMessage(
      '[green]Map voting complete! The next map will be [yellow]' +
        votes[highestVotedMap[0]].name +
        ' [green]with [yellow]' +
        votes[highestVotedMap[0]].total +
        '[green] votes.'
    );
    serverCommands.handleMessage('nextmap ' + votes[highestVotedMap[0]].name.split(' ').join('_'));
    resetVotes();
    if (voteChangesMap) {
      Call.sendMessage('[green]Changing map.');
      Events.fire(new GameOverEvent(Team.crux));
    }
    return;
  }, voteTime / 1000);
};

const showVotes = () => {
  const totals = ['[green]Current votes: \n------------------------------'];
  const maps = Vars.maps.customMaps().toArray();
  for (let i = 0; i < maps.length; i++) {
    if (votes[i].total > 0) {
      totals.push('[cyan]' + maps[i].name() + '[yellow]: ' + votes[i].total);
    }
  }
  totals.push('[green]_________________________');
  Call.sendMessage(totals.join('\n'));
};

const getTimeLeft = () => {
  const endTime = voteStartTime + voteTime;
  const now = Date.now();
  const timeLeft = endTime - now;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  return seconds == 60 ? minutes + 1 + ':00' : minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
};

Events.on(GameOverEvent, (e) => {
  resetVotes();
});

Events.on(ServerLoadEvent, (e) => {
  const clientCommands = Vars.netServer.clientCommands;
  serverCommands = Core.app.listeners.find(
    (l) => l instanceof Packages.mindustry.server.ServerControl
  ).handler;
  const runner = (method) => new Packages.arc.util.CommandHandler.CommandRunner({ accept: method });

  const voteChangesMapSaved = Core.settings.get('vnm', '');

  if (voteChangesMapSaved !== '') {
    voteChangesMap = voteChangesMapSaved === 'true' ? true : false;
  }

  resetVotes();

  // maps
  clientCommands.register(
    'maps',
    'list maps on server',
    runner((args, realP) => {
      realP.sendMessage(
        '\n[yellow]Use [white]/nextmap [lightgray]<map number> [yellow]to vote on a map.\n\n'
      );
      const maps = Vars.maps.customMaps().toArray();
      const mapNames = ['[blue]Available maps:', '_________________________ \n'];
      for (let i = 0; i < maps.length; i++) {
        mapNames.push('[white]' + i + ' - [yellow]' + maps[i].name());
      }
      realP.sendMessage(mapNames.join('\n'));
    })
  );

  // nextmap
  clientCommands.register(
    'nextmap',
    '<map>',
    'vote for the next map. Use /maps to see a list of them.',
    runner((args, realP) => {
      const map = args[0];

      if (!votes[map]) {
        realP.sendMessage(
          '[scarlet]⚠ [yellow]Unknown map number. Use [white]/maps [lightgray]to see a list of maps.'
        );
        return;
      }
      const pid = realP.uuid();

      if (!voteOngoing) {
        alreadyVoted.push(pid);
        startVoteTimer();
        Call.sendMessage(
          '[cyan]Next Map Vote: ' +
            realP.name +
            ' [cyan]Started a map vote, and voted for [white](' +
            String(map) +
            ')' +
            '[yellow] ' +
            votes[map].name +
            '[cyan]. Use /nextmap ' +
            String(map) +
            ' to add your vote!'
        );
        votes[map].total += 1;

        return;
      }

      if (alreadyVoted.includes(pid)) {
        realP.sendMessage(
          '[scarlet]⚠ [yellow]You have already voted. Wait until the vote expires before voting again. [cyan]Time left: [scarlet]' +
            getTimeLeft()
        );
        return;
      }

      alreadyVoted.push(pid);
      votes[map].total += 1;
      Call.sendMessage(
        '[cyan]Next Map Vote: ' +
          realP.name +
          ' [cyan]voted for[yellow] ' +
          votes[map].name +
          '[cyan]. Time left: [scarlet]' +
          getTimeLeft()
      );
      showVotes();
    })
  );

  // voteChangesMap
  serverCommands.register(
    'votechangesmap',
    '<true/false>',
    'set whether a map vote changes the map.',
    runner((args) => {
      if (['true', 'false'].includes(args[0])) {
        voteChangesMap = args[0] === 'true' ? true : false;
        Core.settings.put('vnm', args[0]);
        Core.settings.manualSave();
        Log.info('Vote changes map set to: ' + args[0]);
        return;
      } else {
        Log.info('"' + args[0] + '"' + ' was not recognized. Please use "true" or "false".');
      }
    })
  );
});

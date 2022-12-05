const utils = require('helper2');
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

const colors = ['acid', 'pink', 'teal', 'orange', 'purple', 'coral', 'crimson'];

// Staff online
Timer.schedule(
  () => {
    const staff = utils.memoize(
      () => {
        const tempStaff = ['Staff online:'];
        Groups.player.forEach((pl) => {
          const p = players.getP(pl);
          if (p.admin || p.mod) {
            tempStaff.push(p.name);
          }
        });
        return tempStaff;
      },
      [Groups.player.size()],
      1
    );

    if (staff.length === 1) {
      return;
    }

    Call.infoPopup(staff.join('\n'), 5, Align.topRight, 200, 0, 0, 0);
  },
  5, // time to wait before first execution in seconds
  5 // interval in seconds
);

// Fish Members
Timer.schedule(
  () => {
    const getMembers = () => {
      const tempMembers = ['[yellow] [coral]Fish Members:[white]'];
      Groups.player.forEach((plr) => {
        const pr = players.getP(plr);
        if (pr.member) {
          tempMembers.push(pr.name);
        }
      });
      return tempMembers;
    };

    const members = getMembers();

    if (members.length === 1) {
      return;
    }

    Call.infoPopup(members.join('\n'), 5, Align.topRight, 450, 0, 0, 0);
  },
  5, // time to wait before first execution in seconds
  5 // interval in seconds
);

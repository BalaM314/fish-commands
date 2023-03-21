import { FishPlayer } from "./players";


export function initializeTimers(){
  //Autosave
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
  //Trails
  Timer.schedule(
    () => FishPlayer.forEachPlayer(p => {
      if(p.trail) Call.effect(Fx[p.trail.type], p.player.x, p.player.y, 0, p.trail.color);
    }),
    5,
    0.15
  );
}
import { FishPlayer } from "./players";
import { getStaffMessages } from './api'
import * as config from "./config";


export function initializeTimers(){
	//Autosave
	Timer.schedule(
		() => {
			const file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
			Core.app.post(() => {
				SaveIO.save(file);
				FishPlayer.saveAll();
				Call.sendMessage('[#4fff8f9f]Game saved.');
			});
		},
		10,
		300
	);
	//Trails
	Timer.schedule(
		() => FishPlayer.forEachPlayer(p => p.displayTrail()),
		5,
		0.15
	);
	//Staff chat
	if(!config.localDebug)
		Timer.schedule(() => {
			getStaffMessages((messages) => {
				if(messages.length) FishPlayer.messageStaff(messages);
			})
		}, 5, 3);
}
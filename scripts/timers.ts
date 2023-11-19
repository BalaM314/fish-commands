import { FishPlayer } from "./players";
import { getStaffMessages } from './api'
import * as config from "./config";
import { definitelyRealMemoryCorruption, neutralGameover } from "./utils";


export function initializeTimers(){
	//Autosave
	Timer.schedule(() => {
		const file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
		Core.app.post(() => {
			SaveIO.save(file);
			FishPlayer.saveAll();
			Call.sendMessage('[#4fff8f9f]Game saved.');
		});
	}, 10, 300);
	//Memory corruption prank
	if(config.Mode.pvp())
		Timer.schedule(() => {
			if(Math.random() < 0.2){
				//Timer triggers every 8 hours, and the random chance is 20%, so the average interval between pranks is 40 hours
				definitelyRealMemoryCorruption();
			}
		}, 3600, 28800);
	//Trails
	Timer.schedule(() =>
		FishPlayer.forEachPlayer(p => p.displayTrail()),
	5, 0.15);
	//Staff chat
	if(!config.localDebug)
		Timer.schedule(() => {
			getStaffMessages((messages) => {
				if(messages.length) FishPlayer.messageStaff(messages);
			})
		}, 5, 3);
	//Tip
	Timer.schedule(() => {
		const showAd = Math.random() < 0.10; //10% chance every 15 minutes
		const messagePool = showAd ? config.tips.ads : config.tips.normal;
		const messageText = messagePool[Math.floor(Math.random() * messagePool.length)];
		const message = showAd ? `[gold]${messageText}[]` : `[gold]Tip: ${messageText}[]`
		Call.sendMessage(message);
	}, 0, 15 * 60);
	//State check
	Timer.schedule(() => {
		if(Groups.unit.size() > 10000){
			Call.sendMessage(`\n[scarlet]!!!!!\n[scarlet]Way too many units! Game over!\n[scarlet]!!!!!\n`);
			Groups.unit.clear();
			neutralGameover();
		}
	}, 0, 1);
	Timer.schedule(() => {
		FishPlayer.flagCount = 0;
	}, 0, 60);
}
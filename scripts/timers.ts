import { FishPlayer } from "./players";
import { getStaffMessages } from './api'
import * as config from "./config";
import { definitelyRealMemoryCorruption, neutralGameover } from "./utils";
import { ipJoins } from "./globals";


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
	}, 20, 15 * 60);
	//State check
	Timer.schedule(() => {
		if(Groups.unit.size() > 10000){
			Call.sendMessage(`\n[scarlet]!!!!!\n[scarlet]Way too many units! Game over!\n[scarlet]!!!!!\n`);
			Groups.unit.clear();
			neutralGameover();
		}
	}, 0, 1);
	Timer.schedule(() => {
		FishPlayer.updateAFKCheck();
	}, 0, 1);
	//Various bad antibot code TODO fix, dont update state on clock tick
	Timer.schedule(() => {
		FishPlayer.antiBotModePersist = false;
		//dubious code, will keep antibot mode on for the next minute after it was triggered by high flag count or high join count
		if(FishPlayer.flagCount > 10 || FishPlayer.playersJoinedRecent > 50) FishPlayer.antiBotModePersist = true;
		FishPlayer.flagCount = 0;
		ipJoins.clear();
	}, 0, 60);
	Timer.schedule(() => {
		if(FishPlayer.playersJoinedRecent > 50) FishPlayer.antiBotModePersist = true;
		FishPlayer.playersJoinedRecent = 0;
	}, 0, 40);
	Timer.schedule(() => {
		if(FishPlayer.antiBotMode()){
			Call.infoToast(`[scarlet]ANTIBOT ACTIVE!!![] DOS blacklist size: ${Vars.netServer.admins.dosBlacklist.size}`, 2);
			FishPlayer.forEachPlayer(p => {
				if(p.autoflagged) p.player.kick(Packets.KickReason.banned, 10000000);
			})
		}
	}, 0, 1);
	Timer.schedule(() => {
		FishPlayer.validateVotekickSession();
	}, 0, 0.5);
}
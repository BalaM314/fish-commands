/**
 * contributed by frogo
 * the code style was AAAAAAAAAAAA, see 59bf37bc10cc13a9c1f294ca8d91b0a99be41e62 -BalaM314
 */

import { Perm, commandList } from "./commands";
import { FishPlayer } from "./players";

let lastLabelText = "";
let lastAccessedBulkLabel:FishPlayer | null = null;
let lastAccessedLabel:FishPlayer | null = null;
let lastAccessedBulkLine:FishPlayer | null = null;
let lastAccessedLine:FishPlayer | null = null;

export function loadPacketHandlers(){

	Vars.netServer.addPacketHandler("label", (player:mindustryPlayer, content:string) => {
		try {
			const fishP = FishPlayer.get(player);
			if(!fishP.hasPerm("play")) return;
			const parts = content.split(',');
			if(parts.length != 4){
				player.kick(`\
An error has occured while trying to process your label request:
Improperly formatted content, correct format: text,duration,x,y
Example: "E,10,Vars.player.x,Vars.player.y"
If duration is larger than 10 it will be set to 3
if text length is above 41 you will be kicked`
				, 0);
			} else if(parts[0].length > 41){
				player.kick("ok that's a lot of characters, 41 is the limit here",0);
				return;
			} else {
				const duration = Number(parts[1]) <= 10 ? Number(parts[1]) : 3;
				Call.label(parts[0], duration, Number(parts[2]), Number(parts[3]));
				lastAccessedLabel = fishP;
				lastLabelText = parts[0];
			}
		} catch(e){
			player.kick("An error has occured while trying to process your label request:\n" + e,0)
		}
	});

	Vars.netServer.addPacketHandler("bulkLabel", (player:mindustryPlayer, content:string) => {
		const fishP = FishPlayer.get(player);
		if(!fishP.hasPerm("bulkLabelPacket")){
			player.kick("Not an admin or a moderator, cannot access BulkLabel", 0);
			return;
		}
		try {
			const parts = content.split('|');
			if(parts.length > 1000){
				player.kick("Hey man that's a... i get you're an admin or a moderator but... that's too much labels", 0);
				return;
			}
			for(const labelData of parts){
				const parts_of_part = labelData.split(",");
				Call.labelReliable(parts_of_part[0], Number(parts_of_part[1]), Number(parts_of_part[2]), Number(parts_of_part[3]));
			}
			lastAccessedBulkLabel = fishP;
		} catch(e){
			player.kick("An error has occured while trying to process your label request:\n" + e, 0);
		}
	});

	Vars.netServer.addPacketHandler("lineEffect", (player:mindustryPlayer, content:string) => {
		const fishP = FishPlayer.get(player);
		if(!fishP.hasPerm("play")) return;
		try {
			const parts = content.split(',');
			if(parts.length != 5){
				player.kick(
`An error has occured while trying to process your lineEffect request: invalid format: format is origin_x,origin_y,end_x,end_y,color
example: [5,5,100,100,Color.green].join(",")`
				, 0);
				return;
			}
			Call.effect(
				Fx.pointBeam,
				Number(parts[0]), Number(parts[1]),
				0, Color.valueOf(parts[4]),
				new Vec2(Number(parts[2]), Number(parts[3]))
			);
			lastAccessedLine = fishP;
		} catch(e){
			player.kick("An error has occured while trying to process your lineEffect request:\n" + e, 0);
		}
	});// this is the silas effect

	Vars.netServer.addPacketHandler("bulkLineEffect", (player:mindustryPlayer, content:string) => {
		const fishP = FishPlayer.get(player);
		if(!fishP.hasPerm("play")) return;
		try{
			const parts = content.split('|');
			if(!fishP.hasPerm("bulkLabelPacket") && parts.length > 10){
				player.kick("Non admins can only have a bulk line of 10 parts", 0);
				return;
			}
			if(parts.length >= 1000){
				player.kick("Hey man that's a... i get you're an admin but... that's too much effects", 0);
				return;
			}
			for(const effectData of parts){
				const parts_of_part = effectData.split(",");
				Call.effect(
					Fx.pointBeam, Number(parts_of_part[0]), Number(parts_of_part[1]),
					0, Color.valueOf(parts_of_part[4]),
					new Vec2(Number(parts_of_part[2]), Number(parts_of_part[3]))
				);
			}
			lastAccessedBulkLine = fishP;
		} catch(e){
			player.kick("An error has occured while trying to process your bulkLineEffect request:\n" + e, 0);
		}
	});
	// this is the silas effect but it gets real
	// too real perhap?
	
}

export const commands = commandList({
	packet_handler_last_accessed: {
		args: [],
		description: "Gives you the players and the packet handler which they last accessed",
		perm: Perm.mod,
		handler({output}){
			let outputText = [""];
			if(lastAccessedLabel && lastLabelText) outputText.push(`label: ${lastAccessedLabel.name} last text performed with it: ${lastLabelText}`);
			if(lastAccessedBulkLine) outputText.push(`bulkLine: ${lastAccessedBulkLine.name}`);
			if(lastAccessedLine) outputText.push(`line: ${lastAccessedLine.name}`);
			if(lastAccessedBulkLabel) outputText.push(`line: ${lastAccessedBulkLabel.name}`);
			if(outputText.length > 0){
				output(outputText.join("\n"));
			} else {
				output(`No packet handlers have been accessed.`);
			}
		}
	},
	packet_handler_docs: {
		description: "Documentation on how to use packet handlers that are in this server",
		args: [],
		perm: Perm.none,
		handler({sender}){
			const con = sender.player.con as NetConnection;
			Call.infoMessage(con, "also keep in mind that T H E R E  I S   A   P A C K E T   S P A M   L I M I T");
			Call.infoMessage(con, "[green]Also keep in mind that you have to multiply by 8 to spawn it at a clear coordinate (For example instead of 5,5 you'd have to do 5*8,5*8 to spawn a thing at 5,5, does this sound confusing...)");
			Call.infoMessage(con, `"worst error handling i have ever seen, why kick the player???"\n  -ASimpleBeginner`);
			Call.infoMessage(con, `"The code style when submitted was beyond drunk... but it worked... barely " -BalaM314`);
			Call.infoMessage(con, `these packet handlers and everything related to them were made by [green]frog`);
			Call.infoMessage(con, "All commands mentioned should be performed on the client side console");
			if(sender.hasPerm("bulkLabelPacket")){
				Call.infoMessage(con, `bulkLabel - Call.serverPacketReliable("bulkLabel",/*it's basically like label but seperated by | you get the idea*/) - this is admin only`);
			}
			Call.infoMessage(con, `label - Call.serverPacketReliable("label",[text,duration,x,y].join(","))\nthe text cannot be larger than 41 characters, duration cannot be larger than 10`);
			Call.infoMessage(con, `lineEffect - Call.serverPacketReliable("lineEffect",[startX,startY,endX,endY,color].join(","))\n The color is a hex code and a string`);
			Call.infoMessage(con, `bulkLineEffect - Call.serverPacketReliable("bulkLineEffect",[startX,startY,endX,endY,color].join(",")+"|"+[startX,startY,endX,endY,color].join(",")+"|"))) - lineEffect but seperated by | so packet spam won't be a problem, can only contain 10 effects`);

		}
	}
});

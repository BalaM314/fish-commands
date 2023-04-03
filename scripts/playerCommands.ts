import { Perm } from "./commands";
import { Ohnos } from "./ohno";
import { FishPlayer } from "./players";
import type { FishCommandsList } from "./types";
import { getColor, to2DArray } from "./utils";
import { FishServers } from "./config";

function teleportPlayer(player:mindustryPlayer, to:mindustryPlayer){
	player.unit().set(to.unit().x, to.unit().y);
	Call.setPosition(player.con, to.unit().x, to.unit().y)
	Call.setCameraPosition(player.con, to.unit().x, to.unit().y);
}

const Cleaner = {
	lastCleaned: 0,
	cooldown: 10000,
	clean(user:FishPlayer){
		if(Time.millis() - this.lastCleaned < this.cooldown) return false;
		this.lastCleaned = Time.millis();
		Timer.schedule(
			() => {
				Call.sound(user.con, Sounds.rockBreak, 1, 1, 0);
			},
			0,
			0.05,
			10
		);
		Vars.world.tiles.eachTile((t:Tile) => {
			if([
				107, 105, 109, 106, 111, 108, 112, 117, 115, 116, 110, 125, 124, 103, 113, 114, 122, 123,
			].includes(t.block().id)){
				t.setNet(Blocks.air, Team.sharded, 0);
			}
		});
		return true;
	},
};

function messageStaff(name:string, msg:string){
	const message = `[gray]<[cyan]staff[gray]>[white]${name}[green]: [cyan]${msg}`;
	Groups.player.forEach((pl:mindustryPlayer) => {
		const fishP = FishPlayer.get(pl);
		if(Perm.mod.check(fishP)){
			pl.sendMessage(message);
		}
	});
};

let recentWhispers:Record<string, string> = {};

export const commands:FishCommandsList = {

	unpause: {
		args: [],
		description: "Unpauses the game.",
		perm: Perm.notGriefer,
		handler(){
			Core.app.post(() => Vars.state.set(GameState.State.playing));
		}
	},

	tp: {
		args: ["player:player"],
		description: "Teleport to another player.",
		perm: Perm.notGriefer,
		handler({args, sender, outputFail}){
			if(sender.unit()?.spawnedByCore){
				teleportPlayer(sender.player, args.player.player);
			} else {
				outputFail(`Can only teleport while in a core unit.`);
			}
		}
	},

	clean: {
		args: [],
		description: "Removes all boulders from the map.",
		perm: Perm.notGriefer,
		handler({sender, outputSuccess, outputFail}){
			if(Cleaner.clean(sender)){
				outputSuccess(`Cleared the map of boulders.`);
			} else {
				outputFail(`This command was run recently and is on cooldown.`);
			}
		}
	},

	kill: {
		args: [],
		description: "Commits die.",
		perm: Perm.notGriefer,
		handler({sender}){
			sender.unit()?.kill();
		}
	},

	discord: {
		args: [],
		description: "Takes you to our discord.",
		perm: Perm.all,
		handler({sender}){
			Call.openURI(sender.con, 'https://discord.gg/VpzcYSQ33Y');
		}
	},

	tilelog: {
		args: [],
		description: "Checks the history of a tile.",
		perm: Perm.all,
		handler({sender, output}){
			sender.tilelog = true;
			output(`\n \n \n===>[yellow]Click on a tile to check its recent history...\n \n \n `);
		}
	},

	afk: {
		args: [],
		description: "Toggles your afk status.",
		perm: Perm.all,
		handler({sender, outputSuccess}){
			sender.afk = !sender.afk;
			sender.updateName();
			if(sender.afk){
				outputSuccess(`You are now marked as AFK.`);
			} else {
				outputSuccess(`You are no longer marked as AFK.`);
			}
		}
	},

	tileid: {
		args: [],
		description: "Checks id of a tile.",
		perm: Perm.all,
		handler({sender, output}){
			sender.tileId = true;
			output(`Click a tile to see its id...`);
		}
	},

	...Object.fromEntries(Object.entries(FishServers).map(([name, data]) => [name, {
		args: [],
		description: `Switches to the ${name} server.`,
		perm: Perm.all,
		handler({sender}){
			Call.sendMessage(`${sender.name}[magenta] has gone to the ${name} server. Use [cyan]/${name} [magenta]to join them!`);
			Call.connect(sender.con, data.ip, data.port);
		}
	}])),
	
	s: {
		args: ["message:string"],
		description: `Sends a message to staff only.`,
		perm: Perm.all,
		handler({sender, args}){
			messageStaff(sender.name, args.message);
		}
	},

	/**
	 * This command is mostly for mobile (or players without foos).
	 *
	 * Since the player's unit follows the camera and we are moving the
	 * camera, we need to keep setting the players real position to the
	 * spot the command was made. This is pretty buggy but otherwise the
	 * player will be up the target player's butt
	 */
	watch: {
		args: ["player:player?"],
		description: `Watch/unwatch a player.`,
		perm: Perm.all,
		handler({args, sender, outputSuccess}){
			if(sender.watch){
				outputSuccess(`No longer watching a player.`);
				sender.watch = false;
			} else {
				sender.watch = true;
				const stayX = sender.unit().x;
				const stayY = sender.unit().y;
				const target = args.player.player;
				const watch = () => {
					if(sender.watch){
						// Self.X+(172.5-Self.X)/10
						Call.setCameraPosition(sender.con, target.unit().x, target.unit().y);
						sender.unit().set(stayX, stayY);
						Timer.schedule(() => watch(), 0.1, 0.1, 0);
					} else {
						Call.setCameraPosition(sender.con, stayX, stayY);
					}
				};
	
				watch();
			}

		}
	},

	help: {
		args: ["page:string?"],
		description: "Displays a list of all commands.",
		perm: Perm.all,
		handler({args, output, outputFail}){
			//TODO: genericify
			const filter = {
				member: ['pet', 'highlight', 'rainbow', 'bc'],
				mod: ['warn', 'mute', 'unmute', 'setrank', 'kick', 'stop', 'free', 'murder', 'unmuteall', 'history', 'save', 'stop_offline'],
				admin: ['sus', 'admin', 'mod', 'wave', 'restart', 'forcertv', 'spawn', 'exterminate', 'label', 'member', 'ipban'],
			};

			const normalCommands:string[] = [];
			const modCommands:string[] = [];
			const adminCommands:string[] = [];
			const memberCommands:string[] = [];

			Vars.netServer.clientCommands.getCommandList().forEach((c:Command) => {
				let temp = `/${c.text} ${c.paramText ? `[white]${c.paramText} ` : ""}[lightgrey]- ${c.description}`;
				if(filter.member.includes(c.text)) memberCommands.push('[pink]' + temp);
				else if(filter.mod.includes(c.text)) modCommands.push('[acid]' + temp);
				else if(filter.admin.includes(c.text)) adminCommands.push('[cyan]' + temp);
				else normalCommands.push('[sky]' + temp);
			});
			const chunkedNormalCommands:string[][] = to2DArray(normalCommands, 15);

			switch(args.page){
				case "admin": output('[cyan]--Admin commands--\n' + adminCommands.join('\n')); break;
				case "mod": output('[acid]--Mod commands--\n' + modCommands.join('\n')); break;
				case "member": output('[pink]--Member commands--\n' + memberCommands.join('\n')); break;
				case null: output(
`[sky]--Commands page [lightgrey]1/${chunkedNormalCommands.length} [sky]--
${chunkedNormalCommands[0].join('\n')}`
				); break;
				default:
					const pageNumber = Number(args.page);
					if(chunkedNormalCommands[pageNumber - 1]){
						output(
`[sky]--Commands page [lightgrey]${pageNumber}/${chunkedNormalCommands.length}[sky]--
${chunkedNormalCommands[pageNumber - 1].join("\n")}`
						);
					} else {
						outputFail(`"${args.page}" is an invalid page number.`);
					}
			}
		}
	},

	msg: {
		args: ["player:player", "message:string"],
		description: "Send a message to only one player.",
		perm: Perm.all,
		handler({args, sender, output}){
			recentWhispers[args.player.uuid()] = sender.uuid();
			args.player.sendMessage(`${args.player.player.name}[lightgray] whispered:[#0ffffff0] ${args.message}`);
			output(`[#0ffffff0]Message sent to ${args.player.player.name}[#0ffffff0].`);
		}
	},

	r: {
		args: ["message:string"],
		description: "Reply to the most recent message.",
		perm: Perm.all,
		handler({args, sender, output, outputFail}){
			if(recentWhispers[sender.uuid()]){
				const recipient = FishPlayer.getById(recentWhispers[sender.uuid()]);
				if(recipient?.connected()){
					recipient.sendMessage(`${sender.name}[lightgray] whispered:[#0ffffff0] ${args.message}`);
					output(`[#0ffffff0]Message sent to ${recipient.name}[#0ffffff0].`);
				} else {
					outputFail(`The person who last messaged you doesn't seem to exist anymore. Try whispering to someone with [white]"/msg <player> <message>"`);
				}
			} else {
				outputFail(`It doesn't look like someone has messaged you recently. Try whispering to them with [white]"/msg <player> <message>"`);
			}
		}
	},

	trail: {
		args: ["type:string?", "color:string?"],
		description: 'Use command to see options and toggle trail on/off.',
		perm: Perm.all,
		handler({args, sender, output, outputFail, outputSuccess}){

			//overload 1: type not specified
			if(!args.type){
				if(sender.trail != null){
					sender.trail = null;
					outputSuccess(`Trail turned off.`);
				} else {
					const options = [
						'1 - fluxVapor (flowing smoke, long lasting)',
						'2 - overclocked (diamonds)',
						'3 - overdriven (squares)',
						'4 - shieldBreak (smol)',
						'5 - upgradeCoreBloom (square, long lasting, only orange)',
						'6 - electrified (tiny spiratic diamonds, but only green)',
						'7 - unitDust (same as above but round, and can change colors)',
						'[white]Usage: [orange]/trail [lightgrey]<type> [color/#hex/r,g,b]',
					];
					output(`Available types:[yellow]\n` + options.join('\n'));
				}
				return;
			}

			//overload 2: type specified
			const trailTypes = {
				1: 'fluxVapor',
				2: 'overclocked',
				3: 'overdriven',
				4: 'shieldBreak',
				5: 'upgradeCoreBloom',
				6: 'electrified',
				7: 'unitDust',
			};

			const selectedType = trailTypes[args.type as keyof typeof trailTypes] as string | undefined;
			if(!selectedType){
				if(Object.values(trailTypes).includes(args.type))
					outputFail(`Please use the numeric id to refer to a trail type.`);
				else
					outputFail(`"${args.type}" is not an available type.`);
				return;
			}

			const color = args.color ? getColor(args.color) : Color.white;
			if(color instanceof Color){
				sender.trail = {
					type: selectedType,
					color,
				};
			} else {
				outputFail(
`[scarlet]Sorry, "${args.color}" is not a valid color.
[yellow]Color can be in the following formats:
[pink]pink [white]| [gray]#696969 [white]| 255,0,0.`
				);
			}

		}
	},

	ohno: {
		args: [],
		description: "Spawns an ohno.",
		perm: Perm.notGriefer,
		handler({sender, outputFail}){
			const canSpawn = Ohnos.canSpawn(sender);
			if(canSpawn === true){
				Ohnos.makeOhno(sender.team(), sender.player.x, sender.player.y);
			} else {
				outputFail(canSpawn);
			}
		}
	}
};

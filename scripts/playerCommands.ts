import * as api from './api';
import { command, commandList, fail, formatArg, Perm } from './commands';
import { FishServers, Mode, rules } from './config';
import { ipPortPattern, recentWhispers, tileHistory, uuidPattern } from './globals';
import { menu } from './menus';
import { FishPlayer } from './players';
import { Rank, RoleFlag } from './ranks';
import { capitalizeText, crash, formatTimeRelative, getColor, logAction, nearbyEnemyTile, neutralGameover, StringBuilder, StringIO, teleportPlayer, to2DArray } from './utils';
// import { votekickmanager } from './votes';

export const commands = commandList({
	unpause: {
		args: [],
		description: 'Unpauses the game.',
		perm: Perm.play,
		handler() {
			Core.app.post(() => Vars.state.set(GameState.State.playing));
		},
	},

	tp: {
		args: ['player:player'],
		description: 'Teleport to another player.',
		perm: Perm.play,
		handler({ args, sender }) {
			if(!sender.unit()?.spawnedByCore) fail(`Can only teleport while in a core unit.`);
			if(Mode.pvp()) fail(`This command is disabled in PVP.`);
			if(sender.team() !== args.player.team()) fail(`Cannot teleport to players on another team.`);
			if(sender.unit().hasPayload?.()) fail(`Cannot teleport to players while holding a payload.`);
			teleportPlayer(sender.player, args.player.player);
		},
	},

	clean: {
		args: [],
		description: 'Removes all boulders from the map.',
		perm: Perm.play,
		handler({sender, outputSuccess, lastUsedSuccessfully}){
			if(Date.now() - lastUsedSuccessfully < 100000) fail(`This command was run recently and is on cooldown.`);
			Timer.schedule(
				() => Call.sound(sender.con, Sounds.rockBreak, 1, 1, 0),
				0, 0.05, 10
			);
			Vars.world.tiles.eachTile((t:Tile) => {
				if(t.breakable() && t.block() instanceof Prop){
					t.removeNet();
				}
			});
			outputSuccess(`Cleared the map of boulders.`);
		}
	},

	die: {
		args: [],
		description: 'Commits die.',
		perm: Perm.mod,
		handler({ sender }) {
			sender.unit()?.kill();
		},
	},

	discord: {
		args: [],
		description: 'Takes you to our discord.',
		perm: Perm.none,
		handler({ sender }) {
			Call.openURI(sender.con, 'https://discord.gg/VpzcYSQ33Y');
		},
	},

	tilelog: {
		args: ['persist:boolean?'],
		description: 'Checks the history of a tile.',
		perm: Perm.none,
		handler({args, output, outputSuccess, currentTapMode, handleTaps}){
			if(currentTapMode == "on"){
				handleTaps("off");
				outputSuccess(`Tilelog disabled.`);
			} else {
				if(args.persist){
					handleTaps("on");
					outputSuccess(`Tilelog mode enabled. Click tiles to check their recent history. Run /tilelog again to disable.`);
				} else {
					handleTaps("once");
					output(`Click on a tile to check its recent history...`);
				}
			}
		},
		tapped({tile, x, y, output, sender, admins}){
			const pos = `${x},${y}`;
			if(!tileHistory[pos]){
				output(`[yellow]There is no recorded history for the selected tile (${tile.x}, ${tile.y}).`);
			} else {
				const history = StringIO.read(tileHistory[pos]!, str => str.readArray(d => ({
					action: d.readString(2),
					uuid: d.readString(3)!,
					time: d.readNumber(16),
					type: d.readString(2),
				}), 1));
				output(`[yellow]Tile history for tile (${tile.x}, ${tile.y}):\n` + history.map(e =>
					uuidPattern.test(e.uuid)
					? (sender.hasPerm("viewUUIDs")
					? `[yellow]${admins.getInfoOptional(e.uuid)?.plainLastName()}[lightgray](${e.uuid})[yellow] ${e.action} a [cyan]${e.type}[] ${formatTimeRelative(e.time)}`
					: `[yellow]${admins.getInfoOptional(e.uuid)?.plainLastName()} ${e.action} a [cyan]${e.type}[] ${formatTimeRelative(e.time)}`)
					: `[yellow]${e.uuid}[yellow] ${e.action} a [cyan]${e.type}[] ${formatTimeRelative(e.time)}`
				).join('\n'));
			}
		}
	},

	afk: {
		args: [],
		description: 'Toggles your afk status.',
		perm: Perm.none,
		handler({ sender, outputSuccess }) {
			sender.manualAfk = !sender.manualAfk;
			sender.updateName();
			if(sender.manualAfk) outputSuccess(`You are now marked as AFK.`);
			else outputSuccess(`You are no longer marked as AFK.`);
		},
	},
	vanish: {
		args: ['target:player?'], 
		description: `Toggles visibility of your rank and flags.`,
		perm: Perm.vanish,
		handler({ args, sender, outputSuccess }){
			if(sender.stelled()) fail(`Marked players may not hide flags.`);
			if(sender.muted) fail(`Muted players may not hide flags.`);
			args.target ??= sender;
			if(sender != args.target && args.target.hasPerm("blockTrolling")) fail(`Target is insufficentlly trollable.`);
			if(sender != args.target && !sender.ranksAtLeast("mod")) fail(`You do not have permission to vanish other players.`);
			args.target.showRankPrefix = !args.target.showRankPrefix;
			outputSuccess(
`${args.target == sender ? `Your` : `${args.target.name}'s`} rank prefix is now ${args.target.showRankPrefix ? "visible" : "hidden"}.`
			);
		},
	},
	

	tileid: {
		args: [],
		description: 'Checks id of a tile.',
		perm: Perm.none,
		handler({output, handleTaps}){
			handleTaps("once");
			output(`Click a tile to see its id...`);
		},
		tapped({output, f, tile}){
			output(f`ID is ${tile.block().id}`);
		}
	},

	...Object.fromEntries(
		FishServers.all.map(server => [
			server.name,
			{
				args: [],
				description: `Switches to the ${server.name} server.`,
				perm: Perm.none,
				handler({ sender }) {
					Call.sendMessage(`${sender.name}[magenta] has gone to the ${server.name} server. Use [cyan]/${server.name} [magenta]to join them!`);
					Call.connect(sender.con, server.ip, server.port);
				},
			},
		])
	),

	switch: {
		args: ["server:string", "target:player?"],
		description: "Switches to another server.",
		perm: Perm.none,
		handler({args, sender, f}){
			if(args.target != null && args.target != sender && (!sender.hasPerm("admin") || !sender.canModerate(args.target)))
				fail(f`You do not have permission to switch player ${args.target}.`);
			const target = args.target ?? sender;
			if(ipPortPattern.test(args.server) && sender.hasPerm("admin")){
				//direct connect
				Call.connect(target.con, ...args.server.split(":"));
			} else {
				const server = FishServers.byName(args.server)
					?? fail(`Unknown server ${args.server}. Valid options: ${FishServers.all.map(s => s.name).join(", ")}`);
				if(target == sender)
					Call.sendMessage(`${sender.name}[magenta] has gone to the ${server.name} server. Use [cyan]/${server.name} [magenta]to join them!`);
				Call.connect(target.con, server.ip, server.port);
			}
		}
	},

	s: {
		args: ['message:string'],
		description: `Sends a message to staff only.`,
		perm: Perm.chat,
		handler({ sender, args, outputSuccess, outputFail, lastUsedSender }){
			if(!sender.hasPerm("mod")){
				if(Date.now() - lastUsedSender < 4000) fail(`This command was used recently and is on cooldown. [orange]Misuse of this command may result in a mute.`);
			}
			api.sendStaffMessage(args.message, sender.name, (sent) => {
				if(!sender.hasPerm("mod")){
					if(sent){
						outputSuccess(`Message sent to [orange]all online staff.`);
					} else {
						const wasReceived = FishPlayer.messageStaff(sender.player.name, args.message);
						if(wasReceived) outputSuccess(`Message sent to staff.`);
						else outputFail(`No staff were online to receive your message.`);
					}
				}
			});
		},
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
		args: ['player:player?'],
		description: `Watch/unwatch a player.`,
		perm: Perm.none,
		handler({ args, sender, outputSuccess, outputFail }) {
			if(sender.watch){
				outputSuccess(`No longer watching a player.`);
				sender.watch = false;
			} else if(args.player){
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
			} else {
				outputFail(`No player to unwatch.`);
			}
		},
	},
	spectate: command(() => {
		const spectators = new Map<FishPlayer, Team>();
		function spectate(target:FishPlayer){
			spectators.set(target, target.team());
			target.forceRespawn();
			target.player.team(Team.derelict);
			target.forceRespawn();
		}
		function resume(target:FishPlayer){
			if(spectators.get(target) == null) return; // this state is possible for a person who left not in spectate
			target.player.team(spectators.get(target));
			spectators.delete(target);
			target.forceRespawn();
		}
		Events.on(EventType.GameOverEvent, () => spectators.clear());
		Events.on(EventType.PlayerLeave, (player) => resume(player));
		return {
			args: ["target:player?"],
			description: `Toggles spectator mode in PVP games.`,
			perm: Perm.play,
			handler({args, sender, outputSuccess, f}){
				args.target ??= sender;
				if(!Mode.pvp() && !sender.hasPerm("mod")) fail(`You do not have permission to spectate on a non-pvp server.`);
				if(args.target !== sender && args.target.hasPerm("blockTrolling")) fail(`Target player is insufficiently trollable.`);
				if(args.target !== sender && !sender.ranksAtLeast("admin")) fail(`You do not have permission to force other players to spectate.`);
				if(spectators.has(args.target)){
					resume(args.target);
					outputSuccess(args.target == sender
						? f`Rejoining game as team ${args.target.team()}.`
						: f`Forced ${args.target} out of spectator mode.`
					);
				} else {
					spectate(args.target);
					outputSuccess(args.target == sender
						? f`Now spectating. Run /spectate again to resume gameplay.`
						: f`Forced ${args.target} into spectator mode.`)
					;
				}
			}
		};
	}),
	help: {
		args: ['name:string?'],
		description: 'Displays a list of all commands.',
		perm: Perm.none,
		handler({ args, output, outputFail, sender, allCommands }) {
			const formatCommand = (name: string, color: string) =>
				new StringBuilder()
					.add(`${color}/${name}`)
					.chunk(`[white]${allCommands[name].args.map(formatArg).join(' ')}`)
					.chunk(`[lightgray]- ${allCommands[name].description}`).str;
			const formatList = (commandList: string[], color: string) => commandList.map((c) => formatCommand(c, color)).join('\n');

			if (args.name && isNaN(parseInt(args.name)) && !['mod', 'admin', 'member'].includes(args.name)) {
				//name is not a number or a category, therefore it is probably a command name
				if (args.name in allCommands && (!allCommands[args.name].isHidden || allCommands[args.name].perm.check(sender))) {
					output(
`Help for command ${args.name}:
	${allCommands[args.name].description}
	Usage: [sky]/${args.name} [white]${allCommands[args.name].args.map(formatArg).join(' ')}
	Permission required: ${allCommands[args.name].perm.name}`
					);
				} else {
					outputFail(`Command "${args.name}" does not exist.`);
				}
			} else {
				const commands: {
					[P in 'player' | 'mod' | 'admin' | 'member']: string[];
				} = {
					player: [],
					mod: [],
					admin: [],
					member: [],
				};
				Object.entries(allCommands).forEach(([name, data]) =>
					(data.perm === Perm.admin ? commands.admin : data.perm === Perm.mod ? commands.mod : data.perm === Perm.member ? commands.member : commands.player).push(name)
				);
				const chunkedPlayerCommands: string[][] = to2DArray(commands.player, 15);

				switch (args.name) {
					case 'admin':
						output(`${Perm.admin.color}-- Admin commands --\n` + formatList(commands.admin, Perm.admin.color));
						break;
					case 'mod':
						output(`${Perm.mod.color}-- Mod commands --\n` + formatList(commands.mod, Perm.mod.color));
						break;
					case 'member':
						output(`${Perm.member.color}-- Member commands --\n` + formatList(commands.member, Perm.member.color));
						break;
					default:
						const pageNumber = args.name !== null ? parseInt(args.name) : 1;
						if (pageNumber - 1 in chunkedPlayerCommands) {
							output(`[sky]-- Commands page [lightgrey]${pageNumber}/${chunkedPlayerCommands.length}[sky] --\n` + formatList(chunkedPlayerCommands[pageNumber - 1], '[sky]'));
						} else {
							outputFail(`"${args.name}" is an invalid page number.`);
						}
				}
			}
		},
	},

	msg: {
		args: ['player:player', 'message:string'],
		description: 'Send a message to only one player.',
		perm: Perm.chat,
		handler({ args, sender, output, f }) {
			recentWhispers[args.player.uuid] = sender.uuid;
			args.player.sendMessage(`${sender.player.name}[lightgray] whispered:[#BBBBBB] ${args.message}`);
			output(f`[#BBBBBB]Message sent to ${args.player}.`);
		},
	},

	r: {
		args: ['message:string'],
		description: 'Reply to the most recent message.',
		perm: Perm.chat,
		handler({ args, sender, output, outputFail }) {
			if (recentWhispers[sender.uuid]) {
				const recipient = FishPlayer.getById(recentWhispers[sender.uuid]);
				if (recipient?.connected()) {
					recentWhispers[recentWhispers[sender.uuid]] = sender.uuid;
					recipient.sendMessage(`${sender.name}[lightgray] whispered:[#BBBBBB] ${args.message}`);
					output(`[#BBBBBB]Message sent to ${recipient.name}[#BBBBBB].`);
				} else {
					outputFail(`The person who last messaged you doesn't seem to exist anymore. Try whispering to someone with [white]"/msg <player> <message>"`);
				}
			} else {
				outputFail(`It doesn't look like someone has messaged you recently. Try whispering to them with [white]"/msg <player> <message>"`);
			}
		},
	},

	trail: {
		args: ['type:string?', 'color:string?'],
		description: 'Use command to see options and toggle trail on/off.',
		perm: Perm.none,
		handler({ args, sender, output, outputFail, outputSuccess }) {
			//overload 1: type not specified
			if(!args.type){
				if(sender.trail != null){
					sender.trail = null;
					outputSuccess(`Trail turned off.`);
				} else {
					output(`\
Available types:[yellow]
1 - fluxVapor (flowing smoke, long lasting)
2 - overclocked (diamonds)
3 - overdriven (squares)
4 - shieldBreak (smol)
5 - upgradeCoreBloom (square, long lasting, only orange)
6 - electrified (tiny spiratic diamonds, but only green)
7 - unitDust (same as above but round, and can change colors)
[white]Usage: [orange]/trail [lightgrey]<type> [color/#hex/r,g,b]`
					);
				}
				return;
			}

			//overload 2: type specified
			const trailTypes = {
				"1": 'fluxVapor',
				"2": 'overclocked',
				"3": 'overdriven',
				"4": 'shieldBreak',
				"5": 'upgradeCoreBloom',
				"6": 'electrified',
				"7": 'unitDust',
			};

			const selectedType = trailTypes[args.type as keyof typeof trailTypes] as string | undefined;
			if(!selectedType){
				if(Object.values(trailTypes).includes(args.type)) fail(`Please use the numeric id to refer to a trail type.`);
				else fail(`"${args.type}" is not an available type.`);
			}

			const color = args.color ? getColor(args.color) : Color.white;
			if (color instanceof Color) {
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
		},
	},

	ohno: command({
		args: [],
		description: 'Spawns an ohno.',
		perm: Perm.spawnOhnos,
		init(){
			const Ohnos = {
				enabled: true,
				ohnos: new Array<Unit>(),
				lastSpawned: 0,
				makeOhno(team:Team, x:number, y:number){
					const ohno = UnitTypes.atrax.create(team);
					ohno.set(x, y);
					ohno.type = UnitTypes.alpha;
					ohno.apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
					ohno.resetController(); //does this work?
					ohno.add();
					this.ohnos.push(ohno);
					this.lastSpawned = Date.now();
					return ohno;
				},
				canSpawn(player:FishPlayer):true | string {
					if(!this.enabled) return `Ohnos have been temporarily disabled.`;
					if(!player.connected() || !player.unit().added || player.unit().dead) return `You cannot spawn ohnos while dead.`;
					this.updateLength();
					if(this.ohnos.length >= (Groups.player.size() + 1)) return `Sorry, the max number of ohno units has been reached.`;
					if(nearbyEnemyTile(player.unit(), 6) != null) return `Too close to an enemy tile!`;
					// if(Date.now() - this.lastSpawned < 3000) return `This command is currently on cooldown.`;
					return true;
				},
				updateLength(){
					this.ohnos = this.ohnos.filter(o => o && o.isAdded() && !o.dead);
				},
				killAll(){
					this.ohnos.forEach(ohno => ohno?.kill?.());
					this.ohnos = [];
				},
				amount(){
					return this.ohnos.length;
				},
			};
			Events.on(EventType.GameOverEvent, (e) => {
				Ohnos.killAll();
			});
			return Ohnos;
		},
		handler({ sender, outputFail, data:Ohnos }) {
			const canSpawn = Ohnos.canSpawn(sender);
			if (canSpawn === true) {
				Ohnos.makeOhno(sender.team(), sender.player.x, sender.player.y);
			} else {
				outputFail(canSpawn);
			}
		},
	}),

	ranks: {
		args: [],
		description: 'Displays information about all ranks.',
		perm: Perm.none,
		handler({ output }){
			output(
				`List of ranks:\n` +
					Object.values(Rank.ranks)
						.map((rank) => `${rank.prefix} ${rank.color}${capitalizeText(rank.name)}[]: ${rank.color}${rank.description}[]\n`)
						.join("") +
				`List of flags:\n` +
				Object.values(RoleFlag.flags)
					.map((flag) => `${flag.prefix} ${flag.color}${capitalizeText(flag.name)}[]: ${flag.color}${flag.description}[]\n`)
					.join("")
			);
		},
	},

	rules: {
		args: ['player:player?'],
		description: 'Displays the server rules.',
		perm: Perm.none,
		handler({args, sender, outputSuccess, f}){
			const target = args.player ?? sender;
			if(target !== sender){
				if(!sender.hasPerm("warn")) fail(`You do not have permission to show rules to other players.`);
				if(target.hasPerm("blockTrolling")) fail(f`Player ${args.player} is insufficiently trollable.`);
			}
			menu(
				"Rules for [#0000ff]>|||> FISH [white]servers", rules.join("\n\n"),
				["I agree to abide by these rules", "No"], target,
				({option}) => {
					if(option == "No") target.player.kick("You must agree to the rules to play on this server. Rejoin to agree to the rules.", 1);
				}, false
			);
			if(target !== sender) outputSuccess(f`Reminded ${target} of the rules.`);
		},
	},

	void: {
		args: ["player:player?"],
		description: 'Warns other players about power voids.',
		perm: Perm.play,
		handler({args, sender, lastUsedSuccessfullySender, lastUsedSuccessfully, outputSuccess, f}){
			if(!Mode.attack()) fail(`This command can only be run in Attack.`);
			if(args.player){
				if(Date.now() - lastUsedSuccessfullySender < 20000) fail(`This command was used recently and is on cooldown.`);
				if(!sender.hasPerm("trusted")) fail(`You do not have permission to show popups to other players, please run /void with no arguments to send a chat message to everyone.`);
				if(args.player !== sender && args.player.hasPerm("blockTrolling")) fail(`Target player is insufficiently trollable.`);
				menu("\uf83f [scarlet]WARNING[] \uf83f",
`[white]Don't break the Power Void (\uf83f), it's a trap!
Power voids disable anything they are connected to.
If you break it, [scarlet]you will get attacked[] by enemy units.
Please stop attacking and [lime]build defenses[] first!`,
					["I understand"], args.player
				);
				logAction("showed void warning", sender, args.player);
				outputSuccess(f`Warned ${args.player} about power voids with a popup message.`);
			} else {
				if(Date.now() - lastUsedSuccessfully < 10000) fail(`This command was used recently and is on cooldown.`);
				Call.sendMessage(
`[white]Don't break the Power Void (\uf83f), it's a trap!
Power voids disable anything they are connected to. If you break it, [scarlet]you will get attacked[] by enemy units.
Please stop attacking and [lime]build defenses[] first!`
				);
			}
		},
	},

	team: {
		args: ['team:team', 'target:player?'],
		description: 'Changes the team of a player.',
		perm: Perm.changeTeam,
		handler({args, sender, outputSuccess, f}){
			args.target ??= sender;
			if(!sender.canModerate(args.target, true)) fail(f`You do not have permission to change the team of ${args.target}`);
			if(!sender.hasPerm("changeTeamExternal") && args.team.data().cores.size <= 0) fail(`You do not have permission to change to a team with no cores.`);
			if(!sender.hasPerm("changeTeamExternal") && (!sender.player.dead() && !sender.unit()?.spawnedByCore))
				args.target.forceRespawn();

			args.target.player.team(args.team);
			if(args.target === sender) outputSuccess(f`Changed your team to ${args.team}.`);
			else outputSuccess(f`Changed team of player ${args.target} to ${args.team}.`);
		},
	},

	rank: {
		args: ['player:player'],
		description: 'Displays the rank of a player.',
		perm: Perm.none,
		handler({args, output, f}) {
			output(f`Player ${args.player}'s rank is ${args.player.rank}.`);
		},
	},

	forcertv: {
		args: ["force:boolean?"],
		description: 'Force skip to the next map.',
		perm: Perm.admin,
		handler({args, sender, allCommands}){
			if(args.force === false){
				Call.sendMessage(`RTV: [red] votes cleared by admin [yellow]${sender.name}[red].`);
				allCommands.rtv.data.votes.clear();
			} else {
				Call.sendMessage(`RTV: [green] vote was forced by admin [yellow]${sender.name}[green], changing map.`);
				neutralGameover();
			}
		}
	},
	
	forcevnw: { // will work on all servers for testing / trol purposes
		args: ["force:boolean?"],
		description: 'Force the next wave.',
		perm: Perm.admin,
		handler({args, sender, allCommands}){
			if(args.force === false){
				Call.sendMessage(`VNW: [red] votes cleared by admin [yellow]${sender.name}[red].`);
				allCommands.vnw.data.votes.clear();
			} else {
				let oldTime = Vars.state.wavetime;
				Vars.state.wavetime = 1;
				Core.app.post(() => {Core.app.post(() => {Vars.state.wavetime = oldTime;})});
				logAction("forced next wave", sender);
				allCommands.vnw.data.votes.clear();
				Call.sendMessage(`VNW: [green] vote was forced by admin [yellow]${sender.name}[green], skipping to next wave`);
			}
		}
	},
	vnw: command(() => {
		const votes = new Set<string>();
		const ratio = 0.4;

		const checkVotes = (currentVotes:number, requiredVotes:number) => {
			if(currentVotes >= requiredVotes){
				const oldTime = Vars.state.wavetime;
				Vars.state.wavetime = 1;
				Core.app.post(() => {Core.app.post(() => {Vars.state.wavetime = oldTime;})});
				Call.sendMessage('VNW: [green] vote passed, skipping to next wave');
				votes.clear();
			}
		}

		Events.on(EventType.PlayerLeave, ({player}) => {
			if(votes.has(player.uuid())){
				votes.delete(player.uuid());
				const currentVotes = votes.size;
				const requiredVotes = Math.ceil(ratio * Groups.player.size());
				Call.sendMessage(
					`VNW: [accent]${player.name}[] left, [green]${currentVotes}[] votes, [green]${requiredVotes}[] required`
				);
				checkVotes(currentVotes, requiredVotes);
			}
		});		
		Events.on(EventType.GameOverEvent, () => votes.clear());

		return {
			args: [],
			description: "Vote to start the next wave.",
			perm: Perm.play,
			data: {votes},
			handler({sender, lastUsedSuccessfullySender}){
				if(!Mode.survival()) fail(`This command is only enabled in Survival.`);
				if(Vars.state.gameOver) fail(`This game is already over.`);
				if(Date.now() - lastUsedSuccessfullySender < 10000) fail(`This command was run recently and is on cooldown.`);
				votes.add(sender.uuid);
				const currentVotes = votes.size;
				const requiredVotes = Math.ceil(ratio * Groups.player.size());
				Call.sendMessage(
					`[white]VNW: ${sender.name}[white] wants to skip this wave, [green]${currentVotes}[] votes, [green]${requiredVotes}[] required`
				);
				checkVotes(currentVotes, requiredVotes);
			}
		}	
	}),

	rtv: command(() => {
		const votes = new Set<string>();
		const ratio = 0.5;

		Events.on(EventType.PlayerLeave, ({player}) => {
			if(votes.has(player.uuid())){
				votes.delete(player.uuid());
				const currentVotes = votes.size;
				const requiredVotes = Math.ceil(ratio * Groups.player.size());
				Call.sendMessage(
					`RTV: [accent]${player.name}[] left, [green]${currentVotes}[] votes, [green]${requiredVotes}[] required`
				);
				if(currentVotes >= requiredVotes){
					Call.sendMessage('RTV: [green] vote passed, changing map.');
					neutralGameover();
				}
			}
		});		
		Events.on(EventType.GameOverEvent, () => votes.clear());

		return {
			args: [],
			description: 'Rock the vote to change map',
			perm: Perm.play,
			data: {votes},
			handler({sender, lastUsedSuccessfullySender}){
				if(Vars.state.gameOver) fail(`This map is already finished, cannot RTV. Wait until the next map loads.`);
				if(Date.now() - lastUsedSuccessfullySender < 3000) fail(`This command was run recently and is on cooldown.`);

				votes.add(sender.uuid);
			
				let currentVotes = votes.size;
				let requiredVotes = Math.ceil(ratio * Groups.player.size());
				Call.sendMessage(
					`RTV: [accent]${sender.cleanedName}[] wants to change the map, [green]${currentVotes}[] votes, [green]${requiredVotes}[] required`
				);
				if(currentVotes >= requiredVotes){
					Call.sendMessage('RTV: [green] vote passed, changing map.');
					neutralGameover();
				}
			}
		}	
	}),

	// votekick: {
	//	 args: ["target:player"],
	//	 description: "Starts a vote to kick a player.",
	//	 perm: Perm.play,
	//	 handler({args, sender}){
	// 		if(votekickmanager.currentSession) fail(`There is already a votekick in progress.`);
	// 		votekickmanager.start({
	// 			initiator: sender,
	// 			target: args.player
	// 		});
	//	 }
	// },

	// vote: {
	//	 args: ["vote:boolean"],
	//	 description: "Use /votekick instead.",
	//	 perm: Perm.play,
	//	 handler({sender, args}){
	// 		votekickmanager.handleVote(sender, args ? 1 : -1);
	//	 }
	// },

	forcenextmap: {
		args: ["map:map"],
		description: 'Override the next map in queue.',
		perm: Perm.admin,
		handler({allCommands, args, sender}){
			Vars.maps.setNextMapOverride(args.map);
			if(allCommands.nextmap.data.voteEndTime() > -1){
				//Cancel /nextmap vote if it's ongoing
				allCommands.nextmap.data.cancelVote();
				Call.sendMessage(`[red]Admin ${sender.name}[red] has cancelled the vote. The next map will be [yellow]${args.map.name()}.`);
			}
		},

	},

	maps: {
		args: [],
		description: 'Lists the available maps.',
		perm: Perm.none,
		handler({output}){
			output(`\
[yellow]Use [white]/nextmap [lightgray]<map name> [yellow]to vote on a map.

[blue]Available maps:
_________________________
${Vars.maps.customMaps().toArray().map((map, i) =>
`[white]${i + 1} - [yellow]${map.name()}`
).join("\n")}`
			);
		}
	},

	nextmap: command(() => {
		const votes = new Map<FishPlayer, MMap>();
		let voteEndTime = -1;
		const voteDuration = 1.5 * 60000; // 1.5 mins
		let task: TimerTask | null = null;

		function resetVotes(){
			votes.clear();
			voteEndTime = -1;
		}

		/** Must be called only if there is an ongoing vote. */
		function cancelVote(){
			resetVotes();
			task!.cancel();
		}

		function getMapData():Seq<ObjectIntMapEntry<MMap>> {
			return [...votes.values()].reduce(
				(acc, map) => (acc.increment(map), acc), new ObjectIntMap<MMap>()
			).entries().toArray();
		}

		function showVotes(){
			Call.sendMessage(`\
[green]Current votes:
------------------------------
${getMapData().map(({key:map, value:votes}) =>
`[cyan]${map.name()}[yellow]: ${votes}`
).toString("\n")}`
			);
		}

		function startVote(){
			voteEndTime = Date.now() + voteDuration;
			task = Timer.schedule(endVote, voteDuration / 1000);
		}

		function endVote(){
			if(voteEndTime == -1) return; //aborted somehow
			if(votes.size == 0) return; //no votes?

			const mapData = getMapData();
			const highestVoteCount = mapData.max(floatf(e => e.value)).value;
			const highestVotedMaps = mapData.select(e => e.value == highestVoteCount);
			let winner:MMap;

			if(highestVotedMaps.size > 1){
				winner = highestVotedMaps.random()!.key;
				Call.sendMessage(
		`[green]There was a tie between the following maps: 
		${highestVotedMaps.map(({key:map, value:votes}) => 
		`[cyan]${map.name()}[yellow]: ${votes}`
		).toString("\n")}
		[green]Picking random winner: [yellow]${winner.name()}`
				);
			} else {
				winner = highestVotedMaps.get(0)!.key;
				Call.sendMessage(`[green]Map voting complete! The next map will be [yellow]${winner.name()} [green]with [yellow]${highestVoteCount}[green] votes.`);
			}
			Vars.maps.setNextMapOverride(winner);
			resetVotes();
		}

		Events.on(EventType.GameOverEvent, resetVotes);
		Events.on(EventType.ServerLoadEvent, resetVotes);

		return {
			args: ['map:map'],
			description: 'Allows you to vote for the next map. Use /maps to see all available maps.',
			perm: Perm.play,
			data: {votes, voteEndTime: () => voteEndTime, resetVotes, endVote, cancelVote},
			handler({args:{map}, sender, lastUsedSuccessfullySender}){
				if(Mode.hexed()) fail(`This command is disabled in Hexed.`);
				if(votes.get(sender)) fail(`You have already voted.`);
				if(Date.now() - lastUsedSuccessfullySender < 10000) fail(`This command was run recently and is on cooldown.`);
	
				votes.set(sender, map);
				if(voteEndTime == -1){
					startVote();
					Call.sendMessage(`[cyan]Next Map Vote: ${sender.name}[cyan] started a map vote, and voted for [yellow]${map.name()}[cyan]. Use /nextmap ${map.plainName()} to add your vote!`);
				} else {
					Call.sendMessage(`[cyan]Next Map Vote: ${sender.name}[cyan] voted for [yellow]${map.name()}[cyan]. Time left: [scarlet]${formatTimeRelative(voteEndTime, true)}`);
					showVotes();
				}
			}
		};
	}),
	stats: {
		args: ["target:player"],
		perm: Perm.none,
		description: "Views a player's stats.",
		handler({args:{target}, output, f}){
			output(f`[accent]\
Statistics for player ${target}:
(note: we started recording statistics on 22 Jan 2024)
[white]--------------[]
Blocks broken: ${target.stats.blocksBroken}
Blocks placed: ${target.stats.blocksPlaced}
Chat messages sent: ${target.stats.chatMessagesSent}
Games finished: ${target.stats.gamesFinished}
Win rate: ${target.stats.gamesWon / target.stats.gamesFinished}`
			);
		}
	},
});

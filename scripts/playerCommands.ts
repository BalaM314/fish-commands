import { PermissionsLevel, canPlayerAccess } from "./commands";
import { FishPlayer } from "./players";
const utils = require('./utils');

function teleportPlayer(player:mindustryPlayer, to:mindustryPlayer){
  player.unit().set(to.unit().x, to.unit().y);
  Call.setPosition(player.con, to.unit().x, to.unit().y)
  Call.setCameraPosition(player.con, to.unit().x, to.unit().y);
}

const Cleaner = {
	lastCleaned: 0,
	cooldown: 10000,
  clean(user:mindustryPlayer){
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
    if(fishP.admin || fishP.mod) {
      pl.sendMessage(message);
    }
  });
};

export const commands:FishCommandsList = {

	unpause: {
		args: [],
		description: "Unpauses the game.",
		level: PermissionsLevel.notGriefer,
		handler(){
			Core.app.post(() => Vars.state.set(GameState.State.playing));
		}
	},

	tp: {
		args: ["player:player"],
		description: "Teleport to another player.",
		level: PermissionsLevel.notGriefer,
		handler({args, sender, outputFail}){
			if(sender.player.unit()?.spawnedByCore){
				teleportPlayer(sender, args.player);
			} else {
				outputFail(`Can only teleport while in a core unit.`);
			}
		}
	},

	clean: {
		args: [],
		description: "Removes all boulders from the map.",
		level: PermissionsLevel.notGriefer,
		handler({sender, outputSuccess, outputFail}){
			if(Cleaner.clean(sender.player)){
        outputSuccess(`\u2714 Cleared the map of boulders.`);
      } else {
        outputFail(`This command was run recently and is on cooldown.`);
      }
		}
	},

	kill: {
		args: [],
		description: "Commits die.",
		level: PermissionsLevel.notGriefer,
		handler({sender}){
			sender.player.unit()?.kill();
		}
	},

	discord: {
		args: [],
		description: "Takes you to our discord.",
		level: PermissionsLevel.all,
		handler({sender}){
			Call.openURI(sender.player.con, 'https://discord.gg/VpzcYSQ33Y');
		}
	},

	tilelog: {
		args: [],
		description: "Checks the history of a tile.",
		level: PermissionsLevel.all,
		handler({sender, output}){
			sender.tilelog = true;
			output(`\n \n \n===>[yellow]Click on a tile to check its recent history...\n \n \n `);
		}
	},

	afk: {
		args: [],
		description: "Toggles your afk status.",
		level: PermissionsLevel.all,
		handler({sender, outputSuccess}){
			sender.afk = !sender.afk;
			sender.updateName();
			if(sender.afk){
				outputSuccess(`You are marked as AFK.`);
			} else {
				outputSuccess(`You are no longer marked as AFK.`);
			}
		}
	},

	tileid: {
		args: [],
		description: "Checks id of a tile.",
		level: PermissionsLevel.all,
		handler({sender, outputSuccess}){
			sender.tileId = true;
			outputSuccess(`Click a tile to see its id.`);
		}
	},

	attack: {
		args: [],
		description: "Switches to the attack server.",
		level: PermissionsLevel.all,
		handler({sender}){
			Call.sendMessage(`${sender.name}[magenta] has gone to the attack server. Use [cyan]/attack [magenta]to join them!`);
			Call.connect(sender.player.con, '162.248.100.98', '6567');
		}
	},

	survival: {
		args: [],
		description: "Switches to the survival server.",
		level: PermissionsLevel.all,
		handler({sender}){
			Call.sendMessage(`${sender.name}[magenta] has gone to the survival server. Use [cyan]/survival [magenta]to join them!`);
			Call.connect(sender.player.con, '170.187.144.235', '6567');
		}
	},
	
	s: {
		args: ["message:string"],
		description: `Sends a message to staff only.`,
		level: PermissionsLevel.all,
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
		level: PermissionsLevel.all,
		handler({args, sender, outputSuccess}){
			if(sender.watch){
				outputSuccess(`No longer watching a player.`);
				sender.watch = false;
			}

			sender.watch = true;
			const stayX = sender.player.unit().x;
      const stayY = sender.player.unit().y;
			const target = args.player.player;
			function watch(){
        if (sender.watch) {
          // Self.X+(172.5-Self.X)/10
          Call.setCameraPosition(sender.player.con, target.unit().x, target.unit().y);
          sender.player.unit().set(stayX, stayY);
          Timer.schedule(() => watch(), 0.1, 0.1, 0);
        } else {
          Call.setCameraPosition(sender.player.con, stayX, stayY);
        }
      };

      watch();
		}
	},

	help: {
		args: ["page:string?"],
		description: "Displays a list of all commands.",
		level: PermissionsLevel.all,
		handler({args, output, outputFail}){
			//TODO: genericify
			const filter = {
        member: ['pet', 'highlight', 'rainbow', 'bc'],
        mod: ['warn', 'mute', 'kick', 'stop', 'free', 'murder', 'unmuteall', 'history', 'save'],
        admin: ['sus', 'admin', 'mod', 'wave', 'restart', 'forcertv', 'spawn', 'exterminate', 'label', 'member', 'ipban'],
      };

      const normalCommands:string[] = [];
      const modCommands:string[] = [];
      const adminCommands:string[] = [];
      const memberCommands:string[] = [];

      Vars.netServer.clientCommands.getCommandList().forEach((c:any) => {
				let temp = `/${c.text} ${c.paramText ? `[white]${c.paramText} ` : ""}[lightgrey]- ${c.description}`;
        if(filter.member.includes(c.text)) memberCommands.push('[pink]' + temp);
        else if(filter.mod.includes(c.text)) modCommands.push('[acid]' + temp);
        else if(filter.admin.includes(c.text)) adminCommands.push('[cyan]' + temp);
        else normalCommands.push('[sky]' + temp);
      });
			const chunkedNormalCommands:string[][] = utils.createChunks(normalCommands, 15);

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
	}
};

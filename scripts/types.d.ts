import type { FishPlayer } from "./players";
import type { CommandArgType, Perm } from "./commands";


type FishCommandArgType = string | number | FishPlayer | boolean | null;
type MenuListener = (player:mindustryPlayer, option:number) => void;

type ArgsFromArgData<Args extends PreprocessedCommandArgs> = {
	[K in keyof Args]: (
		Args[K]["type"] extends "string" ? string :
		Args[K]["type"] extends "boolean" ? boolean :
		Args[K]["type"] extends "number" ? number :
		Args[K]["type"] extends "player" ? FishPlayer : 
		Args[K]["type"] extends "namedPlayer" ? FishPlayer :
		never
	) | (Args[K]["optional"] extends true ? null : never);
};

interface FishCommandRunner {
	(_:{
		/**Raw arguments that were passed to the command. */
		rawArgs:(string | undefined)[];
		/**Formatted and parsed args. Access an argument by name, like python's keyword args. Example: `args.player.mod = true`. An argument can only be null if it was optional, otherwise the command will error before the handler runs. */
		args:Record<string, any>;//TODO maybe get this with an abominable conditional type?
		//having to manually cast the args is super annoying
		//but if I leave it as any it causes bugs
		/**The player who ran the command. */
		sender:FishPlayer;
		outputSuccess:(message:string) => void;
		outputFail:(message:string) => void;
		output:(message:string) => void;
		/**Executes a server console command. Be careful! */
		execServer:(message:string) => void;
	}): unknown;
}

interface FishConsoleCommandRunner {
	(_:{
		/**Raw arguments that were passed to the command. */
		rawArgs:(string | undefined)[];
		/**Formatted and parsed args. Access an argument by name, like python's keyword args. Example: `args.player.mod = true`. An argument can only be null if it was optional, otherwise the command will error before the handler runs. */
		args:Record<string, any>;//TODO maybe get this with an abominable conditional type?
		//having to manually cast the args is super annoying
		//but if I leave it as any it causes bugs
		outputSuccess:(message:string) => void;
		outputFail:(message:string) => void;
		output:(message:string) => void;
		/**Executes a server console command. Do not commit recursion as that will cause a crash.*/
		execServer:(message:string) => void;
	}): unknown;
}

interface FishCommandData {
	/**Args for this command, like ["player:player", "reason:string?"] */
	args: string[];
	description: string;
	/**Permission level required for players to run this command. If the player does not have this permission, the handler is not run and an error message is printed. */
	perm: Perm;
	/**Custom error message for unauthorized players. The default is `You do not have the required permission (mod) to execute this command`. */
	customUnauthorizedMessage?: string;
	handler: FishCommandRunner;
}
interface FishConsoleCommandData {
	/**Args for this command, like ["player:player", "reason:string?"] */
	args: string[];
	description: string;
	handler: FishConsoleCommandRunner;
}
type FishCommandsList = Record<string, FishCommandData>;
type FishConsoleCommandsList = Record<string, FishConsoleCommandData>;

interface TileHistoryEntry {
  name:string;
  action:string;
  type:string;
  time:number;
}


interface FishPlayerData {
	name: string;
	muted: boolean;
	member: boolean;
	stopped: boolean;
	rank: string;
	highlight: string | null;
	rainbow: { speed:number; } | null;
	history: PlayerHistoryEntry[];
	usid: string | null;
}

interface PlayerHistoryEntry {
	action:string;
	by:string;
	time:number;
}
interface mindustryPlayerData {
	/**uuid */
	id: string;
	lastName: string;
	lastIP: string;
	ips: Seq<string>;
	names: Seq<string>;
	adminUsid: string | null;
	timesKicked: number;
	timesJoined: number;
	admin: boolean;
	banned: boolean;
	lastKicked: number;
}

interface ClientCommandHandler {
	register(name:string, args:string, description:string, runner:(args:string[], player:mindustryPlayer) => unknown):void;
	removeCommand(name:string):void;
}

interface ServerCommandHandler {
	/**Executes a server console command. */
	handleMessage(command:string):void;
	register(name:string, args:string, description:string, runner:(args:string[], player:mindustryPlayer) => unknown):void;
	removeCommand(name:string):void;
}

interface PreprocessedCommandArg {
	type: CommandArgType;
	/**Whether the argument is optional (and may be null) */
	optional?: boolean;
}

type PreprocessedCommandArgs = Record<string, PreprocessedCommandArg>;

interface CommandArg {
	name: string;
	type: CommandArgType;
	isOptional: boolean;
}
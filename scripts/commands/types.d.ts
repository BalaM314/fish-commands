declare const Call: any;
declare const Strings: {
	stripColors(string:string): string;
}
type FishCommandArgType = string | number | FishPlayer | boolean | null;

interface FishCommandRunner {
	(_:{
		/**Raw arguments that were passed to the command. */
		rawArgs:(string | undefined)[];
		/**Formatted and parsed args. Access an argument by name, like python's keyword args. Example: `args.player.mod = true`. An argument can only be null if it was optional, otherwise the command will error before the handler runs. */
		args:Record<string, any>;
		/**The player who ran the command. */
		sender:FishPlayer;
		outputSuccess:(message:string) => void;
		outputFail:(message:string) => void;
		/**Executes a server console command. Be careful! */
		execServer:(message:string) => void;
	}): void;
}

interface FishCommandData {
	/**Args for this command, like ["player:player", "reason:string?"] */
	args: string[];
	description: string;
	/**Permission level required for players to run this command. If the player does not have this permission, the handler is not run and an error message is printed. */
	level: PermissionsLevel;
	/**Custom error message for unauthorized players. The default is `You do not have the required permission (mod) to execute this command`. */
	customUnauthorizedMessage?: string;
	handler: FishCommandRunner;
}
type FishCommandsList = Record<string, FishCommandData>;

interface FishPlayer {
	player: mindustryPlayer;
	name: string;
	muted: boolean;
	mod: boolean;
	admin: boolean;
	member: boolean;
	stopped: boolean;
	/*rank*/
	watch: boolean;
	pet: string;
	highlight: null;
	history: [];
	fakeAdmin: false;
}

/* mindustry.gen.Player */
type mindustryPlayer = any;

interface ClientCommandHandler {
	register(name:string, args:string, description:string, runner:(args:string[], player:mindustryPlayer) => void):void;
}

interface ServerCommandHandler {
	/**Executes a server console command. */
	handleMessage(command:string):void;
}

interface CommandArg {
	name: string;
	type: CommandArgType;
	isOptional: boolean;
}
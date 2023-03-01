declare const Call: any;
declare const Strings: {
	stripColors(string:string): string;
}
type FishCommandArgType = string | number | FishPlayer | null;

interface FishCommandRunner {
	(_:{
		rawArgs:(string | undefined)[],
		args:Record<string, any>,
		sender:FishPlayer,
		outputSuccess:(message:string) => void,
		outputFail:(message:string) => void
	}): void;
}

interface FishCommandData {
	args: string[],
	description: string,
	level: PermissionsLevel,
	handler: FishCommandRunner,
}
type FishCommandsList = Record<string, FishCommandData>;

interface FishPlayer {
	player: mindustryPlayer;
	name: string,
	muted: boolean,
	mod: boolean,
	admin: boolean,
	member: boolean,
	stopped: boolean,
	/*rank*/
	watch: boolean,
	pet: string,
	highlight: null,
	history: [],
	fakeAdmin: false,
}

/* mindustry.gen.Player */
type mindustryPlayer = any;

interface ClientCommandHandler {
	register(name:string, args:string, description:string, runner:(args:string[], player:mindustryPlayer) => void):void;
}
interface CommandArg {
	name: string;
	type: CommandArgType;
	isOptional: boolean;
}
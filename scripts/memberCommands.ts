import { Perm, commandList, fail } from "./commands";
import { FishPlayer } from "./players";


export const commands = commandList({
	pet: {
		args: ["name:string?"],
		description: 'Spawns a cool pet with a displayed name that follows you around.',
		perm: Perm.member,
		handler({args, sender, outputSuccess}){
			if(!args.name){
				const pet = Groups.unit.find(u => u.id === sender.pet);
				if(pet) pet.kill();
				sender.pet = "";
				outputSuccess("Your pet has been removed.");
				return;
			}
			if(sender.pet !== ''){
				const pet = Groups.unit.find(u => u.id === sender.pet);
				if(pet) pet.kill();
				sender.pet = '';
			}

			const pet = UnitTypes.merui.spawn(sender.team(), sender.unit().x, sender.unit().y);
			pet.apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
			sender.pet = pet.id;

			Call.infoPopup('[#7FD7FD7f]', 5, Align.topRight, 180, 0, 0, 10);
			outputSuccess(`Spawned a pet.`);

			function controlUnit({pet, fishPlayer, petName}:{
				petName: string; pet: Unit; fishPlayer: FishPlayer;
			}){
				return Timer.schedule(() => {
					if(pet.id !== fishPlayer.pet || !fishPlayer.connected()){
						pet.kill();
						return;
					}

					const distX = fishPlayer.unit().x - pet.x;
					const distY = fishPlayer.unit().y - pet.y;
					if(distX >= 50 || distX <= -50 || distY >= 50 || distY <= -50){
						pet.approach(new Vec2(distX, distY));
					}
					Call.label(petName, 0.07, pet.x, pet.y + 5);
					if(fishPlayer.trail){
						Call.effect(Fx[fishPlayer.trail.type], pet.x, pet.y, 0, fishPlayer.trail.color);
					}
					controlUnit({ petName, pet, fishPlayer });
				}, 0.05);
			};
			controlUnit({ petName: args.name, pet, fishPlayer: sender });
		}
	},

	highlight: {
		args: ['color:string?'],
		description: 'Makes your chat text colored by default.',
		perm: Perm.member,
		handler({args, sender, outputFail, outputSuccess}){
			if(args.color == null){
				if(sender.highlight != null){
					sender.highlight = null;
					outputSuccess("Cleared your highlight.");
				} else {
					outputFail("No highlight to clear.");
				}
			} else if(Strings.stripColors(args.color) == ""){
				sender.highlight = args.color;
				outputSuccess(`Set highlight to ${args.color.replace("[","").replace("]","")}.`);
			} else if(Strings.stripColors(`[${args.color}]`) == ""){
				sender.highlight = `[${args.color}]`;
				outputSuccess(`Set highlight to ${args.color}.`);
			} else {
				outputFail(`[yellow]"${args.color}[yellow]" was not a valid color!`);
			}
		}
	},

	rainbow: {
		args: ["speed:number?"],
		description: 'make your name change colors.',
		perm: Perm.member,
		handler({args, sender}){

			if(!args.speed){
				sender.updateName();
				sender.rainbow = null;
			} else {
				if(args.speed > 10 || args.speed <= 0 || !Number.isInteger(args.speed)){
					fail('Speed must be a number between 0 and 10.');
				}
	
				sender.rainbow ??= {
					speed: args.speed,
				};
				const colors = ['[red]', '[orange]', '[yellow]', '[acid]', '[blue]', '[purple]'];
				const rainbowLoop = function(index:number, fishP:FishPlayer){
					Timer.schedule(() => {
						if(!fishP.rainbow) return;
						sender.player.name = colors[index % colors.length] + Strings.stripColors(sender.name);
						rainbowLoop(index + 1, fishP);
					}, args.speed! / 5);
				}
				rainbowLoop(0, sender);
			}

		}
	}
});
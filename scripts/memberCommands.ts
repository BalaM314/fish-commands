import { PermissionsLevel } from "./commands";
import { FishPlayer } from "./players";
import type { FishCommandsList } from "./types";
const trails = require('trails');

export const commands:FishCommandsList = {
  pet: {
    args: ["name:string?"],
    description: 'Spawns a cool pet with a displayed name that follows you around.',
    level: PermissionsLevel.member,
    handler({args, sender}){
      if (!args.name) {
        const pet = Groups.unit.find((u:any) => u.id === sender.pet);
        if(pet) pet.kill();
        sender.pet = "";
        return;
      }
      if (sender.pet !== '') {
        const pet = Groups.unit.find((u:any) => u.id === sender.pet);
        if(pet) pet.kill();
        sender.pet = '';
      }

      const pet = UnitTypes.merui.spawn(sender.player.team(), sender.player.unit().x, sender.player.unit().y);
      pet.apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
      sender.pet = pet.id;

      Call.infoPopup('[#7FD7FD7f]', 5, Align.topRight, 180, 0, 0, 10);

      function controlUnit({pet, fishPlayer, petName}:{
        petName: string; pet: any; fishPlayer: FishPlayer;
      }){
        return Timer.schedule(() => {
          if(pet.id !== fishPlayer.pet || fishPlayer.player.con.hasDisconnected){
            pet.kill();
            return;
          }

          const distX = fishPlayer.player.unit().x - pet.x;
          const distY = fishPlayer.player.unit().y - pet.y;
          if(distX >= 50 || distX <= -50 || distY >= 50 || distY <= -50){
            pet.approach(new Vec2(distX, distY));
          }
          Call.label(petName, 0.07, pet.x, pet.y + 5);
          if(trails.getTrails().includes(fishPlayer.player.uuid()) && fishPlayer.trail){
            Call.effect(Fx[fishPlayer.trail.type], pet.x, pet.y, 0, fishPlayer.trail.color);
          }
          controlUnit({ petName, pet, fishPlayer });
        }, 0.05);
      };
      controlUnit({ petName: args.name, pet, fishPlayer: sender });
    }
  },

  highlight: {
    args: ['color:string'],
    description: 'Makes your chat text colored by default.',
    level: PermissionsLevel.member,
    handler({args, sender, outputFail}){
      if(Strings.stripColors(args.color) == ""){
        sender.highlight = args[0];
      } else if(Strings.stripColors(`[${args.color}]`) == ""){
        sender.highlight = `[${args.color}]`;
      } else {
        outputFail(`[yellow]"${args.color}[yellow]" was not a valid color!`);
      }
    }
  },

  rainbow: {
    args: ["speed:number?"],
    description: 'make your name change colors.',
    level: PermissionsLevel.member,
    handler({args, sender, outputFail}){

      if(!args.speed) {
        sender.updateName();
        sender.rainbow = null;
        return;
      }

      if(args.speed > 10 || args.speed <= 0){
        outputFail('Speed must be a number between 0 and 10.');
        return;
      }

      sender.rainbow ??= {
        speed: args.speed,
      };

      const colors = ['[red]', '[orange]', '[yellow]', '[acid]', '[blue]', '[purple]'];
      function rainbowLoop(index:number, fishP:FishPlayer){
        Timer.schedule(() => {
          if (!fishP.rainbow) return;
          sender.player.name = colors[index % colors.length] + Strings.stripColors(sender.name);
          rainbowLoop(index + 1, fishP);
        }, args.speed / 5);
      }
      rainbowLoop(0, sender);
    }
  }
};
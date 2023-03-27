"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
var commands_1 = require("./commands");
exports.commands = {
    pet: {
        args: ["name:string?"],
        description: 'Spawns a cool pet with a displayed name that follows you around.',
        level: commands_1.Perm.member,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender;
            if (!args.name) {
                var pet_1 = Groups.unit.find(function (u) { return u.id === sender.pet; });
                if (pet_1)
                    pet_1.kill();
                sender.pet = "";
                return;
            }
            if (sender.pet !== '') {
                var pet_2 = Groups.unit.find(function (u) { return u.id === sender.pet; });
                if (pet_2)
                    pet_2.kill();
                sender.pet = '';
            }
            var pet = UnitTypes.merui.spawn(sender.player.team(), sender.player.unit().x, sender.player.unit().y);
            pet.apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
            sender.pet = pet.id;
            Call.infoPopup('[#7FD7FD7f]', 5, Align.topRight, 180, 0, 0, 10);
            function controlUnit(_a) {
                var pet = _a.pet, fishPlayer = _a.fishPlayer, petName = _a.petName;
                return Timer.schedule(function () {
                    if (pet.id !== fishPlayer.pet || fishPlayer.player.con.hasDisconnected) {
                        pet.kill();
                        return;
                    }
                    var distX = fishPlayer.player.unit().x - pet.x;
                    var distY = fishPlayer.player.unit().y - pet.y;
                    if (distX >= 50 || distX <= -50 || distY >= 50 || distY <= -50) {
                        pet.approach(new Vec2(distX, distY));
                    }
                    Call.label(petName, 0.07, pet.x, pet.y + 5);
                    if (fishPlayer.trail) {
                        Call.effect(Fx[fishPlayer.trail.type], pet.x, pet.y, 0, fishPlayer.trail.color);
                    }
                    controlUnit({ petName: petName, pet: pet, fishPlayer: fishPlayer });
                }, 0.05);
            }
            ;
            controlUnit({ petName: args.name, pet: pet, fishPlayer: sender });
        }
    },
    highlight: {
        args: ['color:string'],
        description: 'Makes your chat text colored by default.',
        level: commands_1.Perm.member,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputFail = _a.outputFail;
            if (Strings.stripColors(args.color) == "") {
                sender.highlight = args[0];
            }
            else if (Strings.stripColors("[".concat(args.color, "]")) == "") {
                sender.highlight = "[".concat(args.color, "]");
            }
            else {
                outputFail("[yellow]\"".concat(args.color, "[yellow]\" was not a valid color!"));
            }
        }
    },
    rainbow: {
        args: ["speed:number?"],
        description: 'make your name change colors.',
        level: commands_1.Perm.member,
        handler: function (_a) {
            var _b;
            var args = _a.args, sender = _a.sender, outputFail = _a.outputFail;
            if (!args.speed) {
                sender.updateName();
                sender.rainbow = null;
                return;
            }
            if (args.speed > 10 || args.speed <= 0) {
                outputFail('Speed must be a number between 0 and 10.');
                return;
            }
            (_b = sender.rainbow) !== null && _b !== void 0 ? _b : (sender.rainbow = {
                speed: args.speed,
            });
            var colors = ['[red]', '[orange]', '[yellow]', '[acid]', '[blue]', '[purple]'];
            function rainbowLoop(index, fishP) {
                Timer.schedule(function () {
                    if (!fishP.rainbow)
                        return;
                    sender.player.name = colors[index % colors.length] + Strings.stripColors(sender.name);
                    rainbowLoop(index + 1, fishP);
                }, args.speed / 5);
            }
            rainbowLoop(0, sender);
        }
    }
};

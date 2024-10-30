"use strict";
/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains member commands, which are fun cosmetics for donators.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
var commands_1 = require("./commands");
exports.commands = (0, commands_1.commandList)({
    pet: {
        args: ["name:string?"],
        description: 'Spawns a cool pet with a displayed name that follows you around.',
        perm: commands_1.Perm.member,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess;
            if (!args.name) {
                var pet_1 = Groups.unit.find(function (u) { return u.id === sender.pet; });
                if (pet_1)
                    pet_1.kill();
                sender.pet = "";
                outputSuccess("Your pet has been removed.");
                return;
            }
            if (sender.pet !== '') {
                var pet_2 = Groups.unit.find(function (u) { return u.id === sender.pet; });
                if (pet_2)
                    pet_2.kill();
                sender.pet = '';
            }
            var pet = UnitTypes.merui.spawn(sender.team(), sender.unit().x, sender.unit().y);
            pet.apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
            sender.pet = pet.id;
            Call.infoPopup('[#7FD7FD7f]\uE81B', 5, Align.topRight, 180, 0, 0, 10);
            outputSuccess("Spawned a pet.");
            function controlUnit(_a) {
                var pet = _a.pet, fishPlayer = _a.fishPlayer, petName = _a.petName;
                return Timer.schedule(function () {
                    if (pet.id !== fishPlayer.pet || !fishPlayer.connected()) {
                        pet.kill();
                        return;
                    }
                    var distX = fishPlayer.unit().x - pet.x;
                    var distY = fishPlayer.unit().y - pet.y;
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
        args: ['color:string?'],
        description: 'Makes your chat text colored by default.',
        perm: commands_1.Perm.member,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess;
            if (args.color == null || args.color.length == 0) {
                if (sender.highlight != null) {
                    sender.highlight = null;
                    outputSuccess("Cleared your highlight.");
                }
                else {
                    outputFail("No highlight to clear.");
                }
            }
            else if (Strings.stripColors(args.color) == "") {
                sender.highlight = args.color;
                outputSuccess("Set highlight to ".concat(args.color.replace("[", "").replace("]", ""), "."));
            }
            else if (Strings.stripColors("[".concat(args.color, "]")) == "") {
                sender.highlight = "[".concat(args.color, "]");
                outputSuccess("Set highlight to ".concat(args.color, "."));
            }
            else {
                outputFail("[yellow]\"".concat(args.color, "[yellow]\" was not a valid color!"));
            }
        }
    },
    rainbow: {
        args: ["speed:number?"],
        description: 'Make your name change colors.',
        perm: commands_1.Perm.member,
        handler: function (_a) {
            var _b;
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess;
            var colors = ['[red]', '[orange]', '[yellow]', '[acid]', '[blue]', '[purple]'];
            function rainbowLoop(index, fishP) {
                Timer.schedule(function () {
                    if (!(fishP.rainbow && fishP.player && fishP.connected()))
                        return;
                    fishP.player.name = colors[index % colors.length] + Strings.stripColors(fishP.player.name);
                    rainbowLoop(index + 1, fishP);
                }, args.speed / 5);
            }
            if (!args.speed) {
                sender.rainbow = null;
                sender.updateName();
                outputSuccess("Turned off rainbow.");
            }
            else {
                if (args.speed > 10 || args.speed <= 0 || !Number.isInteger(args.speed)) {
                    (0, commands_1.fail)('Speed must be an integer between 0 and 10.');
                }
                (_b = sender.rainbow) !== null && _b !== void 0 ? _b : (sender.rainbow = { speed: args.speed });
                rainbowLoop(0, sender);
                outputSuccess("Activated rainbow name mode with speed ".concat(args.speed));
            }
        }
    }
});

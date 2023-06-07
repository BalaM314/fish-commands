"use strict";
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
            Call.infoPopup('[#7FD7FD7f]', 5, Align.topRight, 180, 0, 0, 10);
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
            if (args.color == null) {
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
        description: 'make your name change colors.',
        perm: commands_1.Perm.member,
        handler: function (_a) {
            var _b;
            var args = _a.args, sender = _a.sender;
            if (!args.speed) {
                sender.updateName();
                sender.rainbow = null;
            }
            else {
                if (args.speed > 10 || args.speed <= 0 || !Number.isInteger(args.speed)) {
                    (0, commands_1.fail)('Speed must be a number between 0 and 10.');
                }
                (_b = sender.rainbow) !== null && _b !== void 0 ? _b : (sender.rainbow = {
                    speed: args.speed,
                });
                var colors_1 = ['[red]', '[orange]', '[yellow]', '[acid]', '[blue]', '[purple]'];
                var rainbowLoop_1 = function (index, fishP) {
                    Timer.schedule(function () {
                        if (!fishP.rainbow)
                            return;
                        sender.player.name = colors_1[index % colors_1.length] + Strings.stripColors(sender.player.name);
                        rainbowLoop_1(index + 1, fishP);
                    }, args.speed / 5);
                };
                rainbowLoop_1(0, sender);
            }
        }
    }
});

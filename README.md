# Fish commands

A custom commands plugin for >|||>Fish servers. Created by Brandons404, rewritten by BalaM314.

## Clean and easy to use commands system
Example code:
![image](https://github.com/BalaM314/fish-commands/assets/71201189/27ca4b91-dd6b-4ed2-a171-11526502bd9d)
![image](https://github.com/BalaM314/fish-commands/assets/71201189/905cdb4e-b34f-4b4d-bc57-a8e6991d93c9)
![image](https://github.com/BalaM314/fish-commands/assets/71201189/2c85d8d4-ef21-45b5-9235-2e79cacc9bd1)

List of features:
* Low-boilerplate argument handling system that supports arguments of various types, and optional arguments. Automatically generates an error if one of the args is invalid (eg, specifying a team that does not exist, or an ambiguous player name).
* Intellisense for the arguments (The IDE will see `args: ["team:team?"]` and correctly type `args.team` as `Team | null`)
* Callback-based menu system
* Command handlers are provided with the command's usage stats (how long ago the command was used, etc)
* Tap handling system
* Permission handling system
* Easy failing with fail() and its associated pattern
* Automatically allows using a menu to resolve arguments left blank

## Player commands

`/tp` teleport to another player.

`/clean` clear the map of boulders.

`/kill` commit die.

`/discord` takes you to our discord.

`/tilelog` check recent build history of a tile.

`/tileid` check id of a tile.

`/attack` switch to the attack server.

`/survival` switch to the survival server.

`/ohno` spawns an ohno unit.

`/help [pageNumber/mod/admin/member]` shows our custom help page.

`/s <message...>` sends a message only to staff.

`/watch [playerName]` watch/unwatch a player.

`/trail [type] [color/#hex/r,g,b]` Use command to see options and toggle trail on/off.

`/msg <player> <message...>` send a private message to a player.

`/r <message...>` reply to most recent message.

## Staff commands

> \* commands with "(optional)" will display a menu if no argument is given.

`/warn <name> [reason...]` warn a player.

`/sus <uwu>` if you know, you know.

`/mute [player(optional)]` Toggle whether a player is muted or not.

`/kick <player> [reason...]` Kick a player with optional reason.

`/stop [player(optional)]` prevent player from performing any actions.

`/free <player>` free a player.

`/mod <add/remove> <player>` add or remove a player's mod status.

`/admin <add/remove> <player>` add or remove a player's admin status.

`/murder` Kills all ohno units

`/unmuteall` unmute all muted players.

`/restart` saves and restarts the server.

`/history <player>` Show moderation history for a player.

`/save` saves the game state.

`/wave <number>` sets the wave number.

`/label <time> <message...>` places a label at your position for designated length of time.

`/member <add/remove> <player>` change a player's member status.

`/ipban` choose a player to ban by ip

## Member commands

`/pet <name...>` spawns a cool pet with a displayed name that follows you around.

`/highlight <color>` make your chat text colored by default.

`/rainbow [speed]` make your name change colors.

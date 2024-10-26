# Important information about the codebase

## General structure
* The plugin's code is written in Typescript, stored as .ts files in `src/`.
* These files are compiled into `.js` files stored in `build/`.
  * The main.js file is special: it is written in js and needs to be manually copied to build.
* The `build/*.js` files **are committed**.
* The JS files are run by an old, buggy version of Mozilla Rhino. (ES5.5) This causes a lot of problems.
* With the power of modern developer tooling, we can use modern features anyway, though.

## Misc

* All times are in unix milliseconds.
* Regexps are broken due to the engine being used. (weird behavior, crashes)
* Use Java regexes instead.

## Systems

### Error handling

This plugin uses the `fail()` function to easily stop running the current function and print an error message.

Example:
```ts
if(target !== sender){
  if(!sender.hasPerm("warn")) fail(`You do not have permission to show rules to other players.`);
  if(target.hasPerm("blockTrolling")) fail(f`Player ${args.player!} is insufficiently trollable.`);
}
```

This allows creating guard clauses. Additionally, it can be used like this:

```ts
const historyData = tileHistory[`${x},${y}`] ?? fail(`There is no recorded history for the selected tile.`);
```

Calling this function is allowed in command handlers and menus.

### Menu system

This plugin uses callback-based menu handling.

#### Before
```ts
const fruits = ['🍏', '🍐', '🍊', '🍉'];
let expectingResponse = false;
const chooseFruitHandler = Menus.registerMenu((player, option) => {
  const fruit = fruits[option];
  if(!expectingResponse) return; //The player can respond to this menu even when we didn't ask, so validation is necessary
  expectingResponse = false;
  if(!fruit) return; //The player can provide any number here, so validation is necessary
  if(fruit == "Cancel") return;
  player.sendMessage(`You chose ${fruit}`);
});
//...
expectingResponse = true;
Call.menu(player.con, chooseFruitHandler, "Fruit", "Choose a fruit", [fruits, ["Cancel"]]);
```
There are a lot of pitfalls that need to stepped over to avoid creating a vulnerability.

For example, this code will break if multiple players try to exploit it.

Additionally, this code will break if there are many fruits, because the options are not split up into rows.

#### After
```ts
menu("Fruit", "Choose a fruit", ['🍏', '🍐', '🍊', '🍉'], player, ({option, sender}) => {
  sender.sendMessage(`You chose ${option}`);
}, true); //"True" automatically includes a "Cancel" option, which does not call the handler when selected.
```

Everything is handled.

### Commands system

This plugin uses a custom commands system, which is much easier to use than the builtin one.

#### Command arguments

Arguments to the command are specified in an array, like this:
```ts
const commands = {
  //...
  rank: {
    args: ["target:player", "extraText:string?"],
    description: "Displays the rank of a player.",
    handler({args, output}) {
      output(`Player ${args.target.name}'s rank is ${args.target.rank.name}.`);
      args; //Type definitions available
      //^? { target: FishPlayer; extraText: string | null; }
    },
  },
};
```

When the command is run, the command system will automatically resolve the first argument as a player. If this fails, an error message is printed and the handler is not run.

If the argument is left blank, the player is shown a menu to select a player.

Arguments can be marked optional by adding `?` after the type.

#### Perm

A Perm represents some permission that is required to run a command. (usually a rank, like "admin" or "trusted") Specifying a Perm is mandatory, so it's not possible to forget setting permissions for a command.

Perms also make it easier to change the required permission for a command, or have a permission require a different level of trust depending on the gamemode. For example, the "change team" permission requires less trust on Sandbox.
```ts
const changeTeam = new Perm("changeTeam", fishP => {switch(true){
  case Mode.sandbox(): return fishP.ranksAtLeast("trusted");
  case Mode.attack(): return fishP.ranksAtLeast("admin");
  case Mode.hexed(): return fishP.ranksAtLeast("mod");
  case Mode.pvp(): return fishP.ranksAtLeast("trusted");
  default: return fishP.ranksAtLeast("admin");
}});
```

#### Req

The Req system handles something that must be in a certain state for a command to run.

For example, `Req.mode("pvp")` returns a requirement function. When called, this function will fail unless the mode is PVP, with the message "This command is only available in PVP."

Requirements can be specified like this:
```ts
requirements: [Req.modeNot("survival"), Req.cooldown(60_000)]
```

This will allow the command to run if the mode is not survival and if it has not been run by the same player in the past 60 seconds, otherwise, an appropriate error message is printed.

### Formatting system

Command handlers are passed a function `f`, which can be used as a tag function for a tagged template literal, like this:

```ts
handler({args, sender, outputSuccess, f}){
  outputSuccess(f`Player ${args.target}'s rank is ${args.target.rank}.`);
}
```

The tag function formats `args.target` (a FishPlayer) as the player's colored name, and `args.target.rank` (a Rank) as the rank's colored name.

`outputSuccess()` prints text with a green color, so the text `'s rank is` between the interpolation values should be colored green, too. This is handled correctly, no matter how many color tags are in the player's name.

## History
* This plugin was originally written in js, by Brandons404. It was created in October 2022.
* See https://github.com/Brandons404/fish-commands/tree/e81bbc9036f7b67b6a503d0b1eb8d3c888d9518c for the state in January 2023.
* BalaM314 ported it to Typescript in March and April 2023, adding new systems and abstractions.
* It remains in active development as of October 2024, receiving contributions from other community members.

## Contributors (by date)
* [Brandons404](https://github.com/Brandons404/)
* [BalaM314](https://github.com/BalaM314/)
* [TheEt1234](https://github.com/TheEt1234/)
* [buthed010203](https://github.com/buthed010203/)
* [Jurorno9](https://github.com/Jurorno9/)
* [Dart25](https://github.com/Dart25/)
* [kenos1](https://github.com/kenos1/)

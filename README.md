# Fish commands

A custom commands plugin for >|||>Fish servers. Created by Brandons404, rewritten by BalaM314.

**Before reading the code, see [docs/info.md](docs/info.md).**

## Clean and easy to use commands system
Example code:
![image](https://github.com/BalaM314/fish-commands/assets/71201189/27ca4b91-dd6b-4ed2-a171-11526502bd9d)
![image](https://github.com/BalaM314/fish-commands/assets/71201189/35d3885c-48cc-4ec8-92b0-1243bc98bdc4)
![image](https://github.com/BalaM314/fish-commands/assets/71201189/2c85d8d4-ef21-45b5-9235-2e79cacc9bd1)

List of notable features:
* Low-boilerplate argument handling system that supports arguments of various types, and optional arguments. Automatically generates an error if one of the args is invalid (eg, specifying a team that does not exist, or an ambiguous player name).
* Intellisense for the arguments (The IDE will see `args: ["team:team?"]` and correctly type `args.team` as `Team | null`)
* Callback-based menu system with builtin permission safety
* Command handlers are provided with the command's usage stats (how long ago the command was used, etc)
* Tap handling system
* Permission handling system
* Easy failing with fail() and its associated pattern
* Automatically allows using a menu to resolve arguments left blank

Interested in contributing? See [CONTRIBUTING.md](CONTRIBUTING.md), and thanks in advance!

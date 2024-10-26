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

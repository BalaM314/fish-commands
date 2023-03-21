/**
 * Main file for Fish Commands.
 * Does not do anything other than requiring index.js.
 */

importPackage(Packages.arc);
importPackage(Packages.mindustry.type);

//Polyfill Object.entries
Object.entries = o => Object.keys(o).map(k => [k, o[k]]);

require("index");
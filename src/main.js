/*
Copyright © BalaM314, 2024. All Rights Reserved.
This is a special file which is automatically loaded by the game server.
It only contains polyfills, and requires index.js.
*/
//WARNING: changes to this file must be manually copied to /build/scripts/main.js

importPackage(Packages.arc);
importClass(Packages.arc.util.CommandHandler);
importPackage(Packages.mindustry.type);
importClass(Packages.mindustry.server.ServerControl);
importPackage(Packages.java.util.regex);
importClass(Packages.java.lang.Runtime);
importClass(Packages.java.lang.ProcessBuilder);
importClass(Packages.java.nio.file.Paths);

//Polyfills
Object.entries = o => Object.keys(o).map(k => [k, o[k]]);
Object.values = o => Object.keys(o).map(k => o[k]);
Object.fromEntries = a => a.reduce((o, [k, v]) => { o[k] = v; return o; }, {});
//Arrow functions do not bind to "this"
Array.prototype.at = function(i){
	return this[i < 0 ? this.length + i : i];
}
String.prototype.at = function(i){
	return this[i < 0 ? this.length + i : i];
}
Array.prototype.flat = function(depth){
	depth = (depth == undefined) ? 1 : depth;
	return depth > 0 ? this.reduce((acc, item) =>
		acc.concat(Array.isArray(item) ? item.flat(depth - 1) : item)
	, []) : this;
}
String.raw = function(callSite){
	const substitutions = Array.prototype.slice.call(arguments, 1);
	return Array.from(callSite.raw).map((chunk, i) => {
		if (callSite.raw.length <= i) {
			return chunk;
		}
		return substitutions[i - 1] ? substitutions[i - 1] + chunk : chunk;
	}).join('');
}
//Fix rhino regex
if(/ae?a/.test("aeea")){
	RegExp.prototype.test = function(input){
		//overwrite with java regex
		return java.util.regex.Pattern.compile(this.source).matcher(input).find();
	};
}

this.Promise = require('promise').Promise;
require("index");

import * as esbuild from "esbuild";
import * as fs from "fs";

if(/scripts(\/\\)?$/.test(process.cwd())) process.chdir("..");

const banner = `/${"*".repeat(30)}
fish-commands compiled output
${fs.readFileSync("LICENSE", "utf-8")}
Source code available at https://github.com/Fish-Community/fish-commands/
${"*".repeat(30)}/`;

esbuild.buildSync({
	entryPoints: ["./src/index.ts"],
	banner: { js: banner },
	footer: { js: banner },
	format: "iife",
	outfile: "./build/scripts/bundle.js",
	target: "es5",
	supported: {
		"arrow": true,
		"const-and-let": true,
		"destructuring": true,
		"for-of": true,
		"function-name-configurable": false,
		"generator": true,
	},
	minify: false,
	treeShaking: false,
});



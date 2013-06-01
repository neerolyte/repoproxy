#!/usr/bin/env node

require("coffee-script");
var Proxy = require('./lib/proxy');
var Cleaner = require('./lib/cleaner');
var yaml = require('js-yaml');
var fs = require('fs');

var config = yaml.load(
	fs.readFileSync('./config.yaml', "utf-8")
);

// if cacheDir is relative, make it absolute
if (!config.cacheDir.match(/^\//)) {
	config.cacheDir = process.cwd() + '/' + config.cacheDir;
}

var proxy = new Proxy(config);
proxy.on("log", console.log);
proxy.listen();

var cleaner = new Cleaner(config);
function cleanAndQueue() {
	console.log("Cleaning");
	cleaner.clean().then(function() {
		console.log("Clean completed");
		setTimeout(function() {
			cleanAndQueue();
		}, 30*60*1000);
	});
}
cleanAndQueue();

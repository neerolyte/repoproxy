#!/usr/bin/env node

var Proxy = require('./lib/proxy');
var yaml = require('js-yaml');
var fs = require('fs');

var config = yaml.load(
	fs.readFileSync('./config.yaml', "utf-8")
);

// if cacheDir is relative, make it absolute
if (!config.cacheDir.match(/^\//)) {
	config.cacheDir = __dirname + '/' + config.cacheDir;
}

var proxy = new Proxy(config);
proxy.on("log", console.log);
proxy.listen();

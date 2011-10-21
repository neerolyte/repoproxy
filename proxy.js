#!/usr/bin/env node

var util = require('util');
var http_proxy = require('./lib/proxy');
var fs = require('fs');

var conf = require('./config');

var listen = {};
listen.hostname = conf.listen.hostname;
listen.port = conf.listen.port;
var proxy = http_proxy.createServer(
	conf.proxy
).listen(listen.port, listen.hostname, function() {
	util.log("Listening on interface " + listen.hostname + ":" + listen.port);
});

#!/usr/bin/env node

/**
 * Will render 200 OK if the right URL is hit, that's it
 */

var http = require('http');
var _s = require('underscore.string');
var fs = require('fs');
var util = require('util');

var server = http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end(req.url + "\n");
});

server.listen(function() {
	fs.writeFileSync(__dirname + '/server_port.tmp', server.address().port);
});

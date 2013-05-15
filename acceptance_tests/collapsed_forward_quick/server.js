#!/usr/bin/env node

/**
 * A stupid slow server that spews foo slowly down the line and then
 * shuts down, rejects any subsequent requests
 */

var http = require('http');
var _s = require('underscore.string');
var fs = require('fs');
var firstRequest = true;

var server = http.createServer(function (req, res) {
	if (firstRequest) {
		firstRequest = false;
		res.writeHead(200, {'Content-Type': 'text/plain'});
		sendChunk(res);
	} else {
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.end("Oops!");
	}
});

server.listen(function() {
	fs.writeFileSync(__dirname + '/server_port.tmp', server.address().port);
});

var sent = 0;
var line = _s.repeat("foo", 341) + "\n"; // 1024 characters
var limit = 100; // 100 KB

function sendChunk(res) {
	res.write(line);
	sent++;

	if (sent >= limit) {
		res.end();
		server.close();
	} else {
		setTimeout(function() {
			sendChunk(res);
		}, 10);
	}
}

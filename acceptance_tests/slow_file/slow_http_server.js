#!/usr/bin/env node

/**
 * A stupid slow server that spews foo slowly down the line and then
 * shuts down
 */

var http = require('http');
var _s = require('underscore.string');
var fs = require('fs');

var server = http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	sendChunk(res);
});

server.listen(function() {
	fs.writeFileSync(__dirname + '/slow_server_port.tmp', server.address().port);
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

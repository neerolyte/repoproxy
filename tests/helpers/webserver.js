/**
 * A webserver designed to simulate the types of problems node-proxy should be
 * caching.
 */
var conf = require('./config.js')

var http = require('http').createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('world\n');
});

http.listen(conf.ports.webserver, "127.0.0.1");

var testCase = require('nodeunit').testCase;
var conf = require('./helpers/config')

module.exports = testCase({
    setUp: function (callback) {
		var util = require('util');
		var proxy = require('../lib/proxy')
		var fs = require('fs')

		// set up basic web server
		var http = require('http').createServer(function (req, res) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end('world\n');
		});

		var proxy = proxy.createServer({
			"name": "node-proxy",
			"origins": [
				{
					"host": "127.0.0.1",
					"port": conf.ports.webserver
				}
			],
			"cache": {
				"memory": {
					"maxitems": 1000000,
					"maxmem": 128,
					// TODO: if cleanup is > 0 then it does a setInterval that is not closed by proxy.close()... this is probably a bug
					"cleanup": 0,
					"stats": 0
				},
				"disk": {
					"path": "helpers/cache"
				},
				"stats": 0
			},
			"accesslog": {
				"path": "helpers/access_log"
			}
		});

		this.http = http;
		this.proxy = proxy;

		http.listen(conf.ports.webserver, "127.0.0.1", function() {
			proxy.listen(conf.ports.proxy, '127.0.0.1', function() {
				callback();
			});
		});
	},
    tearDown: function (callback) {
        // clean up
		this.proxy.close()
		this.http.close()
        callback();
    },
	testProxyType: function(test) {
		test.ok(this.proxy instanceof require('../lib/reverseProxy').Server,
			'Proxy has incorrect type');
		test.done()
	},
	testHelloWorld: function(test) {
		var http = require('http')
		var client = http.createClient(conf.ports.proxy, '127.0.0.1');

		var req = client.request('GET', '/hello', {});

		req.end();
		req.on('response', function(res) {
			test.equal('200', res.statusCode);
			res.on('data', function(chunk) {
				if (!this.body) this.body = '';
				this.body += chunk;
			});
			res.on('end', function() {
				test.equal(this.body, 'world\n');
				test.done();
			});
		});
	}
});

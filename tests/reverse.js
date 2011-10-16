var testCase = require('nodeunit').testCase;
var helper = require('./lib/helper')

module.exports = testCase({
    setUp: function (callback) {
		var util = require('util');
		var proxy = require('../lib/proxy');
		var fs = require('fs');

		helper.cleanUpTmp();
		helper.setUp({
			dirs: [
				helper.config.dirs.cache
			]
		});

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
					"port": helper.config.ports.webserver
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
					"path": helper.config.dirs.cache
				},
				"stats": 0
			},
			"accesslog": {
				"path": helper.config.files.accessLog
			}
		});

		this.http = http;
		this.proxy = proxy;

		http.listen(helper.config.ports.webserver, "127.0.0.1", function() {
			proxy.listen(helper.config.ports.proxy, '127.0.0.1', function() {
				callback();
			});
		});
	},
    tearDown: function (callback) {
		var fs = require('fs');
		if (this.proxy)
			this.proxy.close();
		if (this.http)
			this.http.close();
		helper.cleanUpTmp();
        callback();
    },
	testProxyType: function(test) {
		test.ok(this.proxy instanceof require('../lib/reverseProxy').Server,
			'Proxy has incorrect type');
		test.done()
	},
	testHelloWorld: function(test) {
		var http = require('http')
		var client = http.createClient(helper.config.ports.proxy, '127.0.0.1');

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

var testCase = require('nodeunit').testCase;
var conf = require('./helpers/config')

module.exports = testCase({
    setUp: function (callback) {
		var util = require('util');
		var proxy = require('../lib/proxy');
		var fs = require('fs');
		var cacheDir = this.cacheDir = __dirname + '/tmp_cache';

		console.log("mkdir cachedir");
		try {
			fs.mkdirSync(cacheDir, 0777);
		} catch (e) {
			console.log("mkdir failed: " + e.message);
			throw e;
		}
		console.log("post mkdir");

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
					"path": cacheDir
				},
				"stats": 0
			},
			"accesslog": {
				"path": __dirname + '/tmp_access.log'
			}
		});

		this.http = http;
		this.proxy = proxy;

		console.log("starting web server");
		http.listen(conf.ports.webserver, "127.0.0.1", function() {
			console.log("http callback");
			proxy.listen(conf.ports.proxy, '127.0.0.1', function() {
				console.log("runninig callback()")
				callback();
			});
		});
	},
    tearDown: function (callback) {
		var fs = require('fs');
		console.log(this)
		this.proxy.close()
		this.http.close()
		fs.rmdirSync(this.cacheDir)
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

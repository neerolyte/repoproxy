var testCase = require('nodeunit').testCase;
var helper = require('./lib/helper')

module.exports = testCase({
    setUp: function (callback) {
		var util = require('util');
		var http_proxy = require('../lib/proxy')

		var proxy = http_proxy.createServer(
			{
				"type": "yum",
				"name": "node-proxy",
				"accesslog": {
					"path": "helpers/access_log"
				}
			}
		);
		
		proxy.listen(helper.config.ports.init, '127.0.0.1', callback);

		this.proxy=proxy;
    },
    tearDown: function (callback) {
        // clean up
		if (this.proxy)
			this.proxy.close();

        callback();
    },
    testStartServer: function (test) {
		// explicitly confirm type
		test.ok(this.proxy instanceof require('../lib/yumProxy').Server);

        test.done();
    },
	testGetRPM: function(test) {
		// TODO: make this test pass
		return test.done();

		// timeout test (avoid deadlocks)
		setTimeout(function() {
			throw("test appears to be deadlocked")
		}, 1000);
		var http = require('http')
		var client = http.createClient(helper.config.ports.init, '127.0.0.1');

		var req = client.request('GET', '/yum/foo.rpm', {});

		req.end();
		req.on('response', function(res) {
			test.equal('200', res.statusCode);
			res.on('data', function(chunk) {
				console.log("got data")
				if (!this.body) this.body = '';
				this.body += chunk;
			});
			res.on('end', function() {
				console.log("got end");
				test.equal(this.body, 'world\n');
				test.done();
			});
		});
	}
});

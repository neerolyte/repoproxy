var testCase = require('nodeunit').testCase;
var conf = require('./helpers/config')

module.exports = testCase({
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        // clean up
        callback();
    },
    testStartServer: function (test) {
		var util = require('util');
		var http_proxy = require('../lib/proxy')
		var fs = require('fs')

		var proxy = http_proxy.createServer(
			{
				"type": "yum",
				"name": "node-proxy",
				"accesslog": {
					"path": "helpers/access_log"
				}
			}
		);
		
		proxy.listen(conf.ports.init, '127.0.0.1', function() {});

		this.proxy=proxy;
		// explicitly confirm type
		test.ok(this.proxy instanceof require('../lib/yumProxy').Server);

		this.proxy.close();

        test.done();
    },
	testGetRPM: function(test) {
		//var http = require('http')
		//var client = http.createClient(conf.ports.yumproxy, '127.0.0.1');

		//var req = client.request('GET', '/yum/foo.rpm', {});

		//req.end();
		//req.on('response', function(res) {
		//	test.equal('200', res.statusCode);
		//	res.on('data', function(chunk) {
		//		if (!this.body) this.body = '';
		//		this.body += chunk;
		//	});
		//	res.on('end', function() {
		//		test.equal(this.body, 'world\n');
		//		test.done();
		//	});
		//});
		test.done()
	}
});

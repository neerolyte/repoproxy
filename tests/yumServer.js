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
				"type": "YumProxyServer",
				"name": "node-proxy",
				"origins": [
					{
						"host": "google.com",
						"port": 80
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
			}
		);
		
		proxy.listen(conf.ports.init, '127.0.0.1', function() {});

		this.proxy=proxy;
		// explicitly confirm type
		test.ok(this.proxy instanceof require('../lib/proxy').YumProxyServer);

		this.proxy.close();

        test.done();
    }
});

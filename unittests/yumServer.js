var testCase = require('nodeunit').testCase;

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
				"listen": {
					"hostname": "0.0.0.0",
					"port": 12345
				},
				"proxy": {
					"type": "YumProxyServer",
					"name": "node-proxy",
					"origins": [
						{
							"host": "google.com",
							"port": 80
						}
					]
				},
				"cache": {
					"memory": {
						"maxitems": 1000000,
						"maxmem": 128,
						// TODO: if cleanup is > 0 then it does a setInterval that is not closed by proxy.close()... this is probably a bug
						"cleanup": 0,
						"stats": 0
					},
					"disk": {
						"path": "cache"
					},
					"stats": 0
				},
				"accesslog": {
					"path": "access_log"
				}
			}
		);
		
		proxy.listen(12345, '0.0.0.0', function() {});

		this.proxy=proxy;
		// just ensuring that the proxy exists at this point is enough
		test.ok(this.proxy);

		this.proxy.close();

        test.done();
    }
});

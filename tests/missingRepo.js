var testCase = require('nodeunit').testCase;
var fs = require('fs');
var wrench = require('wrench');
var path = require('path');

module.exports = testCase({
    setUp: function (callback) {
		var proxy = this.proxy = require('..').createServer({
			cacheDir: __dirname + '/tmp_cache',
		});
		proxy.log.disable();
		
		proxy.listen(callback);
    },
    tearDown: function (callback) {
        // clean up
		if (this.proxy) {
			if (path.existsSync(this.proxy.options.cacheDir))
				wrench.rmdirSyncRecursive(this.proxy.options.cacheDir);
			this.proxy.close();
		}

        callback();
    },
	testMissingRepo: function(test) {
		var http = require('http')

		// timeout test (avoid deadlocks)
		var deadlockTimeout = setTimeout(function() {
			throw("test appears to be deadlocked")
		}, 1000);

		var address = this.proxy.address();

		var client = http.createClient(address.port, '127.0.0.1');

		var req = client.request('GET', '/foo.rpm', {});

		req.end();
		req.on('response', function(res) {
			test.equal('404', res.statusCode);
			res.on('end', function() {
				clearTimeout(deadlockTimeout);
				test.done();
			});
		});
	},
});

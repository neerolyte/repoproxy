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
		proxy.repos.push({prefix: '/foo'});
		
		proxy.listen(callback);
    },
    tearDown: function (callback) {
        // clean up
		if (this.proxy) {
			if (path.existsSync(this.proxy.options.cacheDir))
				wrench.rmdirSyncRecursive(this.proxy.options.cacheDir);
			this.proxy.close();
		}
		if (path.existsSync(__dirname + '/tmp_secret.txt'))
			fs.unlinkSync(__dirname + '/tmp_secret.txt');

        callback();
    },
	/**
	 * Whitelist paths
	 *
	 * Proxy shouldn't let requests go above the cache dir
	 *
	 * Issue #24
	 */
	testReadAbovePrefix: function(test) {
		var http = require('http')

		// timeout test (avoid deadlocks)
		var deadlockTimeout = setTimeout(function() {
			throw("test appears to be deadlocked")
		}, 1000);

		var address = this.proxy.address();

		var client = http.createClient(address.port, '127.0.0.1');

		wrench.mkdirSyncRecursive(this.proxy.options.cacheDir + '/foo', 0777);
		fs.writeFileSync(
			__dirname + '/tmp_secret.txt',
			'This file is super secret'
		);

		var req = client.request('GET', '/../tmp_secret.txt', {});

		req.end();
		req.on('response', function(res) {
			// requests that attempt to break outside of the prefix should
			// simply be 404'd
			test.equal('404', res.statusCode);
			res.on('end', function() {
				clearTimeout(deadlockTimeout);
				test.done();
			});
		});
	},
});

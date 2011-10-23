var testCase = require('nodeunit').testCase;
var fs = require('fs');
var wrench = require('wrench');
var path = require('path');

module.exports = testCase({
    setUp: function (callback) {
		var proxy = this.proxy = require('..').createServer({
			cacheDir: __dirname + '/tmp_cache',
		});
		//proxy.log.disable();
		proxy.addRepo({prefix: '/foo'});
		
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
		test.ok(
			this.proxy.getStorePath({url:'/foo/../bar.txt'}).indexOf(
				this.proxy.options.cacheDir
			) == 0
		);
		
		test.ok(
			this.proxy.getStorePath({url:'/foo/../../../bar.txt'}).indexOf(
				this.proxy.options.cacheDir
			) == 0
		);
		
		test.ok(
			this.proxy.getStorePath({url:'/../../../bar.txt'}).indexOf(
				this.proxy.options.cacheDir
			) == 0
		);

		test.done();
	},
});

/**
 * Test cases to fire some real(ish) tests directly at the proxy
 * and sanity check the responses
 */
var testCase = require('nodeunit').testCase;
var fs = require('fs');
var wrench = require('wrench');
var path = require('path');

module.exports = testCase({
    setUp: function (callback) {
		var proxy = this.proxy = require('..').createServer({
			cacheDir: __dirname + '/tmp_cache',
		});
		// set up basic web server
		var http = this.http = require('http').createServer(function (req, res) {
			// behavior depends on url path
			if (req.url.match(/^\/echo\/?/)) {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.end(req.url);
			} else if (req.url.match(/^\/fourohfour\/?/)) {
				res.writeHead(404, {'Content-Type': 'text/plain'});
				res.end('No file for you!');
			} else {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.end('Hello world\n');
			}
		});
		
		http.listen(function() {
			// we don't know where the server is until it's already listening
			proxy.repos.push({
				prefix: '/',
				options: {
					host: '127.0.0.1',
					port: http.address().port,
					path: '/',
				}
			});
			proxy.listen(callback);
		});
    },
    tearDown: function (callback) {
        // clean up
		if (this.proxy) {
			if (path.existsSync(this.proxy.options.cacheDir))
				wrench.rmdirSyncRecursive(this.proxy.options.cacheDir);
			this.proxy.close();
		}
		if (this.http)
			this.http.close();

        callback();
    },
    testStartServer: function (test) {
		// explicitly confirm type
		test.ok(this.proxy instanceof require('..').Server);

        test.done();
    },
	testGetRPM: function(test) {
		var http = require('http')

		// timeout test (avoid deadlocks)
		var deadlockTimeout = setTimeout(function() {
			throw("test appears to be deadlocked")
		}, 1000);

		var address = this.proxy.address();

		var client = http.createClient(address.port, '127.0.0.1');

		var req = client.request('GET', '/foo/bar.rpm', {});

		req.end();
		req.on('response', function(res) {
			test.equal('200', res.statusCode);
			res.on('data', function(chunk) {
				if (!this.body) this.body = '';
				this.body += chunk;
			});
			res.on('end', function() {
				test.equal(this.body, 'Hello world\n');
				clearTimeout(deadlockTimeout);
				test.done();
			});
		});
	},
	testCacheStore: function(test) {
		var http = require('http');
		var self = this;

		// timeout test (avoid deadlocks)
		var deadlockTimeout = setTimeout(function() {
			throw("test appears to be deadlocked")
		}, 1000);

		var address = this.proxy.address();

		var client = http.createClient(address.port, '127.0.0.1');

		var req = client.request('GET', '/foo/cache.rpm', {});

		req.end();
		req.on('response', function(res) {
			res.on('end', function() {
				var cached = fs.readFileSync(self.proxy.options.cacheDir + '/foo/cache.rpm');

				test.equal(cached, 'Hello world\n');
				clearTimeout(deadlockTimeout);
				test.done();
			});
		});
	},
	testCacheRetrieve: function(test) {
		var http = require('http');
		var self = this;

		// timeout test (avoid deadlocks)
		var deadlockTimeout = setTimeout(function() {
			throw("test appears to be deadlocked")
		}, 1000);

		var address = this.proxy.address();

		var client = http.createClient(address.port, '127.0.0.1');

		wrench.mkdirSyncRecursive(self.proxy.options.cacheDir + '/foo', 0777);
		fs.writeFileSync(
			self.proxy.options.cacheDir + '/foo/cache.rpm',
			'Cache retrieval test...'
		);

		var req = client.request('GET', '/foo/cache.rpm', {});

		req.end();
		req.on('response', function(res) {
			test.equal('200', res.statusCode);
			res.on('data', function(chunk) {
				if (!this.body) this.body = '';
				this.body += chunk;
			});
			res.on('end', function() {
				test.equal(this.body, 'Cache retrieval test...');
				clearTimeout(deadlockTimeout);
				test.done();
			});
		});
	},
	/**
	 * Secondary requests are cloning earlier request paths
	 *
	 * First request asks for '/foo', proxy requests '/foo' (so far so good).
	 * Second request asks for '/bar', proxy requests '/foo/bar' (oops).
	 *
	 * Issue #15
	 */
	testSubsequentRequestPaths: function(test) {
		var http = require('http')

		// timeout test (avoid deadlocks)
		var deadlockTimeout = setTimeout(function() {
			throw("test appears to be deadlocked")
		}, 1000);

		var address = this.proxy.address();

		var client = http.createClient(address.port, '127.0.0.1');

		var req = client.request('GET', '/echo/foo.rpm', {});
		var req2 = client.request('GET', '/echo/bar.rpm', {});

		req.end();
		req.on('response', function(res) {
			test.equal('200', res.statusCode);
			res.on('data', function(chunk) {
				if (!this.body) this.body = '';
				this.body += chunk;
			});
			res.on('end', function() {
				test.equal(this.body, '/echo/foo.rpm');
				req2.end();
				req2.on('response', function(res) {
					test.equal('200', res.statusCode);
					res.on('data', function(chunk) {
						if (!this.body) this.body = '';
						this.body += chunk;
					});
					res.on('end', function() {
						test.equal(this.body, '/echo/bar.rpm');
						clearTimeout(deadlockTimeout);
						test.done();
					});
				});
			});
		});
	},
	/**
	 * Four oh four
	 *
	 * Issue #13
	 */
	testUpstream404: function(test) {
		var http = require('http')

		// timeout test (avoid deadlocks)
		var deadlockTimeout = setTimeout(function() {
			throw("test appears to be deadlocked")
		}, 1000);

		var address = this.proxy.address();

		var client = http.createClient(address.port, '127.0.0.1');

		var req = client.request('GET', '/fourohfour/foo.rpm', {});

		req.end();
		req.on('response', function(res) {
			test.equal('404', res.statusCode);
			console.log(res.statusCode);
			res.on('data', function(chunk) {
				console.log(chunk.toString());
			});
			res.on('end', function() {
				clearTimeout(deadlockTimeout);
				test.done();
			});
		});
	},
});

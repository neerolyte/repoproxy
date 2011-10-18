/**
 * Test cases to fire some real(ish) tests directly at the proxy
 * and sanity check the responses
 */
var testCase = require('nodeunit').testCase;
var helper = require('./lib/helper')

module.exports = testCase({
    setUp: function (callback) {
		var proxy = this.proxy = require('..').createServer({
			cacheDir: __dirname + '/tmp_cache',
		});
		// set up basic web server
		var http = this.http = require('http').createServer(function (req, res) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end('Hello world\n');
		});
		
		http.listen(function() {
			// we don't know where the server is until it's already listening
			proxy.repos.push({
				host: http.address().address,
				port: http.address().port,
				path: '/yum',
			});
			proxy.listen(callback);
		});
    },
    tearDown: function (callback) {
        // clean up
		if (this.proxy)
			this.proxy.close();
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
		setTimeout(function() {
			throw("test appears to be deadlocked")
		}, 1000);

		var address = this.proxy.address();

		var client = http.createClient(address.port, address.address);

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

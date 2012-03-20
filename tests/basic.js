/**
 * Really basic test cases only
 */
var testCase = require('nodeunit').testCase;
var util = require('util');

module.exports = testCase({
	/**
	 * Repos can be added after createServer()
	 */
    testAddRepo: function (test) {
		var proxy = require('..').createServer()

		test.equal(
			util.inspect(proxy.repos), 
			util.inspect({})
		);

		var repo = require('../lib/repo').createRepo({prefix: '/'});

		proxy.addRepo(repo);

		//console.log();

		test.ok(
			proxy.repos['/'] instanceof require('../lib/repo').Repo
		);

		test.equal(
			Object.keys(proxy.repos).length,
			1
		);

        test.done();
    },
	/**
	 * Test conversion of a request path to a storage path
	 */
	testStorePath: function(test) {
		var proxy = require('..').createServer({
			cacheDir: __dirname + '/tmp_cache',
		});

		var req = {url: '/foo/bar.rpm'};

		test.equal(
			proxy.getStorePath(req),
			__dirname + '/tmp_cache/foo/bar.rpm'
		);
		
		test.done();
	},
	testGetRepo: function(test) {
		var proxy = require('..').createServer();
		
		proxy.addRepo({
			prefix: '/foo', 
			upstream: {
				// upstream repo
				host: 'bar.baz',
				port: 80,
				path: '/foo',
			},
		});

		var req = {url: '/foo/boh.rpm'};
			
		test.equal(
			util.inspect(proxy.getRepoByRequest(req).upstream),
			util.inspect({ host: 'bar.baz', port: 80, path: '/foo' })
		);
		
		test.done();
	},
	/**
	 * Test conversion of a request path to a upstream request
	 */
	testUpstream: function(test) {
		var proxy = require('..').createServer({
			repos: [
				{ 
					// incomming prefix to match on
					prefix: '/foo',
					upstream: {
						host: 'bar.baz',
						port: 80,
						path: '/foo',
					}
				},
			],
		});

		var req = {url: '/foo/boh.rpm'};
			
		test.equal(
			util.inspect(proxy.getUpstreamOptions(req)),
			util.inspect({ host: 'bar.baz', port: 80, path: '/foo/boh.rpm' })
		);
		
		test.done();
	},
});

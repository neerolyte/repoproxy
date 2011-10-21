/**
 * Really basic test cases only
 */
var testCase = require('nodeunit').testCase;

module.exports = testCase({
	/**
	 * Repos can be added after createServer()
	 */
    testAddRepo: function (test) {
		var proxy = require('..').createServer()

		test.equal(proxy.repos.toString(), [].toString(), 'Repos should be empty to start with');

		proxy.repos.push({
			'type': 'foo',
		});

		test.equal(proxy.repos.toString(), [ {type: 'foo'} ].toString(), 'There should be exactly one repo now');

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
	/**
	 * Test conversion of a request path to a upstream request
	 */
	testUpstream: function(test) {
		var proxy = require('..').createServer({
			repos: [
				{ 
					// incomming prefix to match on
					prefix: '/foo',
					options: {
						// upstream repo
						host: 'bar.baz',
						port: 80,
						path: '/foo',
					}
				},
			],
		});

		var req = {url: '/foo/boh.rpm'};
			
		test.equal(
			proxy.getUpstreamOptions(req).toString(),
			{ host: 'bar.baz', port: 80, path: '/foo/boh.rpm' }
		);
		
		test.done();
	},
});

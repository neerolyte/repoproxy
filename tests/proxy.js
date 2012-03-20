var testCase = require('nodeunit').testCase;
var util = require('util');

module.exports = testCase({
	testGetRepoByRequest: function(test) {
		var repoA = require('../lib/repo').createRepo({
			prefix: '/a',
		});
		var repoB = require('../lib/repo').createRepo({
			prefix: '/b',
		});

		var proxy = require('..').createServer();

		proxy.addRepo(repoA);
		proxy.addRepo(repoB);

		test.ok( proxy.getRepoByRequest({ url: '/a'}) === repoA );
		test.ok( proxy.getRepoByRequest({ url: '/b'}) === repoB );
		test.ok( proxy.getRepoByRequest({ url: '/b'}) !== repoA );
		test.ok( proxy.getRepoByRequest({ url: '/'}) === undefined );
		test.ok( proxy.getRepoByRequest({ url: '/foo'}) === undefined );
		test.ok( proxy.getRepoByRequest({ url: '/a/foo'}) === repoA );
		test.ok( proxy.getRepoByRequest({ url: '/b/foo/bar/'}) === repoB );
		test.ok( proxy.getRepoByRequest({ url: '/a/'}) === repoA );
		
		test.done();
	},
});

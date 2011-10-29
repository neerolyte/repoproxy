/**
 * Request specific tests
 */
var testCase = require('nodeunit').testCase;
var fs = require('fs');
var wrench = require('wrench');
var path = require('path');

module.exports = testCase({
	testRelativePath: function(test) {
		var proxy = this.proxy = require('..').createServer();
		proxy.log.disable();
		
		proxy.addRepo(
			require('../lib/repo').createRepo(
				{ prefix: '/foo' }
			)
		);
		
		var req = require('../lib/request').createRequest(
			proxy,
			{ url: '/foo/bar' },
			{}
		);

		test.equal(
			req.getRelativePath(),
			'/bar'
		);
		
		var req = require('../lib/request').createRequest(
			proxy,
			{ url: '/foo' },
			{}
		);
		
		test.equal(
			req.getRelativePath(),
			''
		);
		
		var req = require('../lib/request').createRequest(
			proxy,
			{ url: '/foo/' },
			{}
		);
		
		test.equal(
			req.getRelativePath(),
			''
		);
		
		test.done();
	},
});

var testCase = require('nodeunit').testCase;

module.exports = testCase({
	/**
	 * Test for bug where when insatiating multiple servers, they would all share the
	 * same repos
	 */
    testAddRepoTwice: function (test) {
		var proxy = require('..').createServer()

		test.equal(Object.keys(proxy.repos), 0, 'Repos should be empty to start with');

		proxy.addRepo({prefix: '/'});

		test.equal(proxy.repos.toString(), [ {type: 'foo'} ].toString(), 'There should be exactly one repo now');

		delete proxy;
		
		proxy = require('..').createServer()

		test.equal(Object.keys(proxy.repos).length, 0, 'Repos should be empty to start with');

		proxy.addRepo({prefix: '/'});

		test.equal(Object.keys(proxy.repos).length, 1, 'There should be exactly one repo now');


        test.done();
    },
});

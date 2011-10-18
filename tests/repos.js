var testCase = require('nodeunit').testCase;

module.exports = testCase({
	/**
	 * Test for bug where when insatiating multiple servers, they would all share the
	 * same repos
	 */
    testAddRepoTwice: function (test) {
		var proxy = require('..').createServer()

		test.equal(proxy.repos.toString(), [].toString(), 'Repos should be empty to start with');

		proxy.repos.push({
			'type': 'foo',
		});

		test.equal(proxy.repos.toString(), [ {type: 'foo'} ].toString(), 'There should be exactly one repo now');

		delete proxy;
		
		proxy = require('..').createServer()

		test.equal(proxy.repos.toString(), [].toString(), 'Repos should be empty to start with');

		proxy.repos.push({
			'type': 'foo',
		});

		test.equal(proxy.repos.toString(), [ {type: 'foo'} ].toString(), 'There should be exactly one repo now');


        test.done();
    },
});

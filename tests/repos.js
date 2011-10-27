var testCase = require('nodeunit').testCase;
var util = require('util');

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
	/**
	 * Test that creating a new repo creates the right kind
	 */
    testCreateRepoType: function (test) {
		var repo = require('../lib/repo').createRepo({
			prefix: '/foo'
		});

		test.ok(repo instanceof require('../lib/repo').Repo);
		
		var repo = require('../lib/repo').createRepo({
			prefix: '/foo',
			type: 'Dummy',
		});

		test.ok(repo instanceof require('../lib/repoDummy').Repo);
		
        test.done();
    },
	testRepoGetChildren: function(test) {
		var repo = require('../lib/repo').createRepo({
			prefix: '/foo',
			type: 'Dummy',
			paths: {
				foo: {},
				bar: {
					baz: {}
				},
			}
		});

		test.equal(
			util.inspect(Object.keys(repo.getChildren('/'))),
			util.inspect(['foo', 'bar'])
		);

		test.equal(
			util.inspect(Object.keys(repo.getChildren('/bar'))),
			util.inspect(['baz'])
		);

		test.ok(repo.getChildren('/missing') === null);

		test.equal(
			util.inspect(repo.getChildren('/foo')),
			util.inspect({})
		);

		test.done();
	},
});

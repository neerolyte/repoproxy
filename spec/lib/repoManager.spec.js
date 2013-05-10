describe('RepoManager', function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var util = require('util');

	var RepoManager= require(LIB_DIR + '/repoManager.js');
	var repoManager;

	beforeEach(function() {
		repoManager = new RepoManager();
	});

	it("should assume files are not part of a repository", function() {
		return expect(
			repoManager.getCachePath('http://example.com/some-random-file.txt')
		).to.become();
	});

	it("can be configured", function() {
		repoManager.addRepo({
			name: "example",
			prefixes: [ "http://example.com/" ],
		});

		return expect(
			repoManager.getCachePath("http://example.com/some-file.txt")
		).to.become("example/some-file.txt");
	});
});

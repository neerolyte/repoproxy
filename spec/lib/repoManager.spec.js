describe('RepoManager', function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var util = require('util');

	var RepoManager = require(LIB_DIR + '/repoManager.js');
	var CacheFile = require(LIB_DIR + '/cacheFile.js');
	var repoManager;

	beforeEach(function() {
		repoManager = new RepoManager({ cacheDir: Fixture.cacheDir });
	});

	it("should assume files are not part of a repository", function() {
		return expect(
			repoManager.getRepoInfo('http://example.com/some-random-file.txt')
		).to.become();
	});

	describe("when a repo is configured", function() {
		beforeEach(function() {
			repoManager.addRepo({
				name: "example",
				prefixes: [ "http://example.com/" ],
			});
		});

		it("can retrieve the repo info", function() {
			return expect(
				repoManager.getRepoInfo("http://example.com/some-file.txt")
			).to.deep.become({ path: "example/some-file.txt" });
		});

		it("can get the cache file", function() {
			return expect(
				repoManager.getCacheFile("http://example.com/some-file.txt")
			).to.eventually.be.an.instanceof(CacheFile);
		});
	});
});

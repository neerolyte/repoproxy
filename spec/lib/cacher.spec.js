describe('Cacher', function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var util = require('util');
	var sinon = require('sinon');

	var Cacher = require(Fixture.LIB_DIR + '/cacher');
	var CacheFile = require(Fixture.LIB_DIR + '/cacheFile');
	var cacher;

	beforeEach(function() {
	});

	it("should assume files are not part of a repository", function() {
		cacher = new Cacher({ cacheDir: Fixture.cacheDir });
		return expect(
			cacher.getInfo('http://example.com/some-random-file.txt')
		).to.become();
	});

	describe("when a host is configured", function() {
		beforeEach(function() {
			cacher = new Cacher({
				cacheDir: Fixture.cacheDir ,
				hosts: [ "example.com" ],
			});
		});

		it("can retrieve the cache info", function() {
			return expect(
				cacher.getInfo("http://example.com/some-file.txt")
				.then(function(info) {
					return info.path;
				})
			).to.deep.become("example.com/some-file.txt");
		});

		it("can retrieve cache info if url has a port", function() {
			return expect(
				cacher.getInfo("http://example.com:1234/some-file.txt")
				.then(function(info) {
					return info.path;
				})
			).to.deep.become("example.com/some-file.txt");
		});

		it("can get the cache file", function() {
			return expect(
				cacher.getCacheFile("http://example.com/some-file.txt")
			).to.eventually.be.an.instanceof(CacheFile);
		});

		it("doesn't get the cache file for uncacheable requests", function() {
			return expect(
				cacher.getCacheFile("http://example.com/foo/")
			).to.become();
		});
	});
});

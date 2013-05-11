describe('Cacher', function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var util = require('util');

	var FS = require('q-io/fs');

	var Cacher = require(LIB_DIR + '/cacher.js');
	var CacheFile = require(LIB_DIR + '/cacheFile.js');
	var cacheDir = Fixture.cacheDir;
	var cacher = new Cacher({ cacheDir: cacheDir });


	beforeEach(function() {
		return FS.isDirectory(cacheDir)
		.then(function(isDir) {
			if (isDir) return FS.removeTree(cacheDir);
		}).then(function() {
			return FS.makeTree(cacheDir + '/data');
		});
	});

	after(function() {
		return FS.removeTree(cacheDir);
	});

	it("can create a CacheFile with the cacheDir set", function() {
		return FS.write(cacheDir + '/data/foo', 'bar')
		.then(function() {
			return cacher.getCacheFile("foo");
		}).then(function(cacheFile) {
			return cacheFile.getReader();
		}).then(function(reader) {
			return reader.read();
		}).then(function(buf) {
			expect(buf.toString("utf-8")).to.equal("bar");
		});
	});
});

/**
 * A cacheable file is a representation of a URL that should be cacheable
 * it can be requested for the actual cache entry (which may not exist)
 * and it can be told to update the actual file, the consumer of cacheable
 * file need not know where the file is actually stored.
 */
describe('CacheFile', function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var FS = require('q-io/fs');
	var wrench = require('wrench');
	var cacheDir = Fixture.cacheDir;
	var Q = require('q');

	var CacheFile = require(LIB_DIR + '/cacheFile.js');

	// TODO: it'd be really nice to use a rerooted fs when it gets fixed
	// https://github.com/kriskowal/q-io/pull/32

	beforeEach(function() {
		wrench.rmdirSyncRecursive(cacheDir + '/', true);
		return FS.makeTree(cacheDir)
		.then(function() {
			return FS.makeTree(cacheDir + '/data');
		});
	});

	describe("with no existing file", function() {
		it("knows file is missing", function() {
			var cacheFile = new CacheFile(cacheDir, 'somefile');
			return expect(
				cacheFile.exists()
			).to.become(false);
		});

		it("produces a writeable stream", function() {
			var cacheFile = new CacheFile(cacheDir, 'somefile');
			return cacheFile.getWriter()
			.then(function(writer) {
				return writer.write("foo")
				.then(function() {
					return writer.close();
				});
			}).then(function() {
				return expect(
					FS.read(cacheDir + '/data/somefile')
				).to.become("foo");
			});
		});
	});

	describe("with an existing file", function() {
		beforeEach(function() {
			return FS.write(cacheDir + '/data/somefile', 'foo');
		});

		it("knows file exists", function() {
			var cacheFile = new CacheFile(cacheDir, 'somefile');
			return expect(cacheFile.exists()).to.become(true);
		});

		it("produces a readble stream", function() {
			var cacheFile = new CacheFile(cacheDir, 'somefile');
			return cacheFile.getReader()
			.then(function(reader) {
				return reader.read();
			}).then(function(buf) {
				expect(buf.toString("utf-8")).to.equal("foo");
			});
		});
	});
});

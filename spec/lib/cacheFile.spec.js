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
	var cacheDir = Fixture.cacheDir;
	var Q = require('q');
	var sinon = require('sinon');
	var moment = require('moment');

	var CacheFile = require(LIB_DIR + '/cacheFile.js');

	// TODO: it'd be really nice to use a rerooted fs when it gets fixed
	// https://github.com/kriskowal/q-io/pull/32

	beforeEach(function() {
		return FS.isDirectory(cacheDir)
		.then(function(isDir) {
			if (isDir) return FS.removeTree(cacheDir);
		}).then(function() {
			return FS.makeTree(cacheDir);
		});
	});

	afterEach(function() {
		return FS.isDirectory(cacheDir)
		.then(function(isDir) {
			if (isDir) return FS.removeTree(cacheDir);
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
				return writer.write("baz")
				.then(function() {
					return writer.close();
				});
			}).then(function() {
				return cacheFile.save();
			}).then(function() {
				return expect(
					FS.read(cacheDir + '/data/somefile')
				).to.become("baz");
			});
		});

		it("only places data in meta/data after save() is called", function() {
			var cacheFile = new CacheFile(cacheDir, 'somefile');
			return cacheFile.getWriter()
			.then(function(writer) {
				return expect(FS.isFile(cacheFile.getPath())).to.become(false)
				.then(function() {
					return writer.write("foo");
				}).then(function() {
					return writer.close();
				});
			}).then(function() {
				return expect(FS.isFile(cacheFile.getPath())).to.become(false);
			}).then(function() {
				return cacheFile.save();
			}).then(function() {
				return expect(FS.isFile(cacheFile.getPath())).to.become(true);
			});
		});
	});

	describe("with an existing file", function() {
		beforeEach(function() {
			return Q.all([
				FS.makeTree(cacheDir + '/data'),
				FS.makeTree(cacheDir + '/meta'),
			]).then(function() {
				return Q.all([
					FS.write(cacheDir + '/data/somefile', 'foo'),
					FS.write(cacheDir + '/meta/somefile', JSON.stringify({
						expires: JSON.stringify(moment().add('hours', 1)),
					})),
				]);
			});
		});

		it("knows file exists", function() {
			var cacheFile = new CacheFile(cacheDir, 'somefile');
			return expect(cacheFile.exists()).to.become(true);
		});

		it("knows it doesn't exist if meta is missing", function() {
			var cacheFile = new CacheFile(cacheDir, 'somefile');
			return FS.remove(cacheDir + '/meta/somefile')
			.then(function() {
				return expect(cacheFile.exists()).to.become(false);
			});
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

	describe('metadata', function() {
		it("stores", function() {
			var cacheFile = new CacheFile(cacheDir, 'somefile');
			return cacheFile.getWriter()
			.then(function(writer) {
				return writer.write("baz")
				.then(function() {
					return writer.close();
				});
			}).then(function() {
				return cacheFile.save({ foo: "bar" });
			}).then(function() {
				return Q.all([
					cacheFile.getReader(),
					cacheFile.getMeta(),
				]);
			}).then(function(res) {
				var reader = res[0], meta = res[1];
				expect(meta.foo).to.eql("bar");
				return reader.read();
			}).then(function(buf) {
				expect(buf.toString("utf-8")).to.equal("baz");
			});
		});
	});

	describe("expiry", function() {
		var clock;
		beforeEach(function() {
			clock = sinon.useFakeTimers();
		});

		afterEach(function() {
			clock.restore();
		});

		it("is expired when file is missing", function() {
			var cacheFile = new CacheFile(cacheDir, 'somefile');
			return expect(cacheFile.expired()).to.become(true);
		});

		it("defaults to 30 minutes", function() {
			var cacheFile = new CacheFile(cacheDir, 'somefile');

			return cacheFile.getWriter()
			.then(function(writer) {
				return writer.write("foo")
				.then(function() {
					return writer.close();
				});
			}).then(function() {
				return cacheFile.save();
			}).then(function() {
				clock.tick(30*60*1000-1000);
				return cacheFile.expired();
			}).then(function(expired) {
				expect(expired).to.equal(false);
				clock.tick(1001);
				return cacheFile.expired();
			}).then(function(expired) {
				expect(expired).to.equal(true);
			});
		});

		it("can be configured", function() {
			var cacheFile = new CacheFile(cacheDir, 'somefile');

			return cacheFile.getWriter()
			.then(function(writer) {
				return writer.write("foo")
				.then(function() {
					return writer.close();
				});
			}).then(function() {
				return cacheFile.save({ expiry: moment().add('hours', 10) });
			}).then(function() {
				clock.tick(10*60*60*1000-1000);
				return cacheFile.expired();
			}).then(function(expired) {
				expect(expired).to.equal(false);
				clock.tick(1001);
				return cacheFile.expired();
			}).then(function(expired) {
				expect(expired).to.equal(true);
			});
		});
	});
});

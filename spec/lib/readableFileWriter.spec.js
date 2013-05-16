/**
 * A q-io FS Writer for a file, that can be read from concurrently
 * by multiple clients
 */
describe("ReadableFileWriter", function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var cacheDir = Fixture.cacheDir;
	var FS = require('q-io/fs');
	var Q = require('q');

	var ReadableFileWriter = require(LIB_DIR + '/readableFileWriter.js');

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

	it("writes to a file normally", function() {
		var writer;
	    return ReadableFileWriter.create(cacheDir + '/foo')
		.then(function(w) {
			writer = w;
		}).then(function() {
			return writer.write("bar");
		}).then(function() {
			return writer.close();
		}).then(function() {
			expect(FS.read(cacheDir + '/foo')).to.become("bar");
		});
	});

	describe("WriterReader forEach()", function() {
		it("can be queued before writing starts", function() {
			var writer, reader;
			var content = '';
			var readerWait;
			
			return ReadableFileWriter.create(cacheDir + '/foo')
			.then(function(w) {
				writer = w;
				return writer.getReader();
			}).then(function(r) {
				reader = r;
				readerWait = reader.forEach(function(chunk) { content += chunk.toString("utf-8"); });
				return writer.write("foo");
			}).then(function() {
				return Q.all([
					writer.close(),
					readerWait
				]);
			}).then(function() {
				return expect(content).to.equal("foo");
			});
		});

		it("gets content before writer completes", function() {
			var writer, reader;
			var content = '';
			var readerWaitDeferred = Q.defer();
			
			return ReadableFileWriter.create(cacheDir + '/foo')
			.then(function(w) {
				writer = w;
				return writer.getReader();
			}).then(function(reader) {
				reader.forEach(function(chunk) { 
					content += chunk.toString("utf-8"); 
					readerWaitDeferred.resolve();
				});
			}).then(function() {
				return writer.write("foo");
			}).then(function() {
				return readerWaitDeferred.promise;
			}).then(function() {
				return expect(content).to.equal("foo");
			});
		});

		it("catches up", function() {
			var writer, reader;
			var content = '';
			var readerWaitDeferred = Q.defer();;
			
			return ReadableFileWriter.create(cacheDir + '/foo')
			.then(function(w) {
				writer = w;
				return writer.write("foo");
			}).then(function() {
				return writer.getReader();
			}).then(function(r) {
				reader = r;
				reader.forEach(function(chunk) { 
					content += chunk.toString("utf-8"); 
					readerWaitDeferred.resolve();
				});
			}).then(function() {
				return readerWaitDeferred.promise;
			}).then(function() {
				return expect(content).to.equal("foo");
			});
		});
	});

	describe("move()", function() {
		it("actually moves the file", function() {
			var writer;
			return ReadableFileWriter.create(cacheDir + '/foo')
			.then(function(w) {
				writer = w;
				return writer.close();
			}).then(function() {
				return writer.move(cacheDir + '/bar');
			}).then(function() {
				return expect(FS.isFile(cacheDir + '/bar')).to.become(true);
			});
		});
	});
});

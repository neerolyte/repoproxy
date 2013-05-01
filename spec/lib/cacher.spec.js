describe('Cacher', function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var util = require('util');

	// TODO: add support to fake-fs for file streams so we can use fake-fs during testing
	var fs = require('fs');
	var path = require('path');
	var wrench = require('wrench');

	var Cacher = require(LIB_DIR + '/cacher.js');
	var cacher;

	var cacheDir = path.resolve(__dirname, '../temp');

	beforeEach(function() {
		wrench.rmdirSyncRecursive(cacheDir, true);
		fs.mkdirSync(cacheDir);
		cacher = new Cacher({
			cacheDir: cacheDir
		});
	});

	after(function() {
		wrench.rmdirSyncRecursive(cacheDir, true);
	});

	it("should store new entries", function(done) {
		// get cacher to give us a write stream for a specified path and options list
		// http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
	   	cacher.createWriteStream("somefile").then(function(writer) {
			writer.end('foo');

			writer.on('finish', function() {
				expect(fs.readFileSync(cacheDir + '/data/somefile', 'utf8')).to.deep.eql('foo');
				done();
			});
		});
	});

	it("should become false when asked for a ReadStream for a missing path", function() {
		return expect(cacher.createReadStream("non-existant-file")).to.become(false);
	});

	it("should become true when asked for a ReadStream for a valid file", function(done) {
	   	cacher.createWriteStream("existing-file").then(function(writer) {
			writer.end('foo');

			writer.on('finish', function() {
				expect(cacher.createReadStream("existing-file")).to.not.become(false)
				.then(function() { done(); })
				.fail(function(err) { done(err); });
			});
		});
	});
});

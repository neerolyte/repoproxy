describe('Cacher', function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var util = require('util');

	// TODO: add support to fake-fs for file streams so we can use fake-fs during testing
	var fs = require('fs');

	var Cacher = require(LIB_DIR + '/cacher.js');
	var cacher;

	beforeEach(function() {
		cacher = new Cacher();
	});

	it("should store new entries", function(done) {
		// get cacher to give us a write stream for a specified path and options list
		// http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
		var writer = cacher.createWriteStream("somefile");
		writer.end('foo');

		writer.on('finish', function() {
			expect(fs.readFileSync('somefile', 'utf8')).to.deep.eql('foo');
			done();
		});
	});

	it("should return false when asked for a ReadStream for a missing path", function() {
		expect(cacher.createReadStream("non-existant-file")).to.become.false;
	});
});

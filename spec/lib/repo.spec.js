describe('Repo', function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var util = require('util');

	var Repo = require(LIB_DIR + '/repo.js');

	it("should not be for any files by default", function() {
		expect(new Repo().isFor("http://example.com/foo.txt")).to.be.false;
	});

	it("should accept prefix matches", function() {
		var repo = new Repo({
			prefixes: [ "http://example.com/" ],
		});
		expect(repo.isFor("http://example.com/foo.txt")).to.be.true;
	});
});

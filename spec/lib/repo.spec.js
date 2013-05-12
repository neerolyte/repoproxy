describe('Repo', function() {
	var Fixture = require('../fixture');
	var expect = Fixture.expect;
	var util = require('util');

	var Repo = require(LIB_DIR + '/repo.js');

	it("should not be for any files by default", function() {
		expect(new Repo().getInfo("http://example.com/foo.txt")).to.equal();
	});

	it("should accept prefix matches", function() {
		var repo = new Repo({
			name: 'example',
			prefixes: [ "http://example.com/" ],
		});
		expect(
			repo.getInfo("http://example.com/foo.txt").path
		).to.eql('example/foo.txt');
	});

	it("always ignores directories", function() {
		var repo = new Repo({
			name: 'example',
			prefixes: [ "http://example.com/" ],
		});
		expect(
			repo.getInfo("http://example.com/foo/").cache
		).to.equal(false);
	});
});

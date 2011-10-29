var testCase = require('nodeunit').testCase;
var fs = require('fs');
var wrench = require('wrench');
var path = require('path');
var util = require('util');

module.exports = testCase({
	testParseRelease: function(test) {
		var releaseStr = [
			'SomeIgnoredMetadata: foo',
			'MD5Sum:',
			' 00000000000000000000000000000000     1234 main/binary-foo/Packages.bz2',
		].join('\n');

		var repo = require('../lib/repo').createRepo({
			type: 'Apt'
		});

		repo.indexRelease('dists/dist-bar/Release', releaseStr);

		test.equal(
			'Packages.bz2',
			Object.keys(repo.getChildren('dists/dist-bar/main/binary-foo')).pop()
		);
		
		test.done();
	},
});
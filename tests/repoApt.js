var testCase = require('nodeunit').testCase;
var fs = require('fs');
var wrench = require('wrench');
var path = require('path');
var util = require('util');

module.exports = testCase({
	testIndexRelease: function(test) {
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
	testIndexPackages: function(test) {
		var packagesStr = [
			'Foo: bar',
			'Filename: pool/multiverse/b/bar/bar_0.01.deb',
			'UninterestingMetadata: sure is',
			'',
			'Filename: pool/multiverse/f/foo/foo_1.2.deb',
		].join('\n');

		var repo = require('../lib/repo').createRepo({
			type: 'Apt'
		});

		repo.indexPackages(packagesStr);

		test.equal(
			'bar_0.01.deb',
			Object.keys(repo.getChildren('pool/multiverse/b/bar')).pop()
		);
		
		test.equal(
			'foo_1.2.deb',
			Object.keys(repo.getChildren('pool/multiverse/f/foo')).pop()
		);
		
		test.done();
	},
});
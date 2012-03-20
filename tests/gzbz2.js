/**
 * This mostly just tests my understanding of gzbz2.
 *
 * Surprisingly the test passes.
 */


var gzbz2 = require('gzbz2');
var fs = require('fs');

module.exports = require('nodeunit').testCase({
	testGzipSync: function(test) {

		var filename = __dirname+'/gzbz2_files/fox.gz';

		var gunzip = new gzbz2.Gunzip;
		gunzip.init({encoding: 'utf8'});

		var gzdata = fs.readFileSync(filename);

		var inflated = gunzip.inflate(gzdata, 'binary');
		gunzip.end();

		test.equal(
			inflated,
			'This quick brown fox fell off the end of my string\n'
		);
		
		test.done();
	},
});
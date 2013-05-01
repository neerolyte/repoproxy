// expose the lib dir so we can switch it out for coverage testing
var path = require('path');
LIB_DIR = process.env.TIDIER_COV
	? path.resolve(__dirname, '../lib-cov')
	: path.resolve(__dirname, '../lib');

var chai = require("chai");
chai.use(require("chai-as-promised"));
chai.use(require("sinon-chai"));
module.exports.expect = chai.expect;
require("mocha-as-promised")();

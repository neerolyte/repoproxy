# expose the lib dir so we can switch it out for coverage testing
path = require("path")
LIB_DIR = (if process.env.TIDIER_COV then path.resolve(__dirname, "../lib-cov") else path.resolve(__dirname, "../lib"))
module.exports.LIB_DIR = LIB_DIR
chai = require("chai")
chai.use require("chai-as-promised")
chai.use require("sinon-chai")
module.exports.expect = chai.expect
require("mocha-as-promised")()
module.exports.cacheDir = path.resolve(__dirname, "temp")

var FS = require('q-io/fs');
var util = require('util');

function checkFuncs(obj) {
	checkFunc(obj, 'makeDirectory');
	checkFunc(obj, 'makeTree');
}
function checkFunc(obj, name) {
	console.log(name + ": " + (obj[name]?"exists":"missing"));
}

console.log("Main FS:");
checkFuncs(FS);

FS.reroot('/')
.then(function(fs) {
	fs.makeDirectory('/tmp/test');
});

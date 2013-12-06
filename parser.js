var through = require('through');
var concat = require('concat-stream');

function jsonParseStream() {
	var concatter = concat(function(data) {
		stream.emit('data', JSON.parse(data.toString()));
		stream.emit('end');
	});

	var stream = through(function(data) {
		concatter.write(data);
	}, function() {
		concatter.end();
	});

	return stream;
}
process.stdin.pipe(jsonParseStream()).pipe(through(function(data) {
	console.log(data[1]);
	//console.log(data[0][3]);
}));

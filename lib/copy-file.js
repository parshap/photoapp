var fs = require('fs');

function copyFile(file, output, callback) {
	var read = fs.createReadStream(file);

	read.pipe(output);
	read.on('end', function() {
		callback(null);
	});

	output.on('error', callback);
}

module.exports = copyFile;

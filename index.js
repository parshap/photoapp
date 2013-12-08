var _ = require('underscore')
var fs = require('fs');
var path = require('path');
var async = require('async');
var copyFile = require('./lib/copy-file');
var compressAndMove = require('./lib/compress-and-move');
var scaleSize = require('./lib/sizescaler.js');
var imagesize = require('imagesize');

function shouldHandle(filename) {
	return /\.(?:jpg|jpeg|png)$/i.test(filename);
}

var DEFAULTS = {
	outputSize: 1200,
	minOutputSize: 960,
	widthThreshold: 1500,
	heightThreshold: 1500,
};

/**
 * [opts.watchDir]
 * [opts.compressedDir]
 * [opts.originalsDir]
 * [opts.outputSize]
 * [opts.minOuputSize]
 * [opts.widthThreshold]
 * [opts.heightThreshold]
 *
 * @param {Object} opts
 */
function start(opts, callback) {
	opts = _.extend(DEFAULTS, opts || {});

	/**
	 * Generates the compress fn based on whether the image should be resized
	 *
	 * @param {Object} size
	 * @param {String} filepath (absolute)
	 * @param {Stream} output
	 *
	 * @return {Function}
	 */
	function generateCompressFn(size, filepath, output) {
		console.log('creating compressFn for %s with size =', filepath, size);
		// default compressFn to just move the file to the compressedDir
		var compressFn = copyFile.bind(null, filepath, output);

		if (size.width > opts.widthThreshold || size.height > opts.heightThreshold) {
			// compress fn should actually compress the file
			var newSize = scaleSize(size, opts.outputSize, opts.minOutputSize)
			compressFn = compressAndMove.bind(null, {
				file: filepath,
				output: output,
				height: newSize.height,
				width: newSize.width
			});
		}
		return compressFn;
	}

	fs.watch(opts.watchDir, function(event, filename) {
		console.log("change: %s file: %s", event, filename);
		if (!shouldHandle(filename)) {
			return;
		}

		var filepath = path.join(__dirname, opts.watchDir, filename);

		fs.stat(filepath, function(err, stats) {
			if (err || !stats.isFile()) {
				return;
			}

			imagesize(fs.createReadStream(filepath), function(err, size) {
				if (err) {
					console.error(err);
					return;
				}

				var resizeStream = fs.createWriteStream(path.join(opts.compressedDir, filename));
				var backupStream = fs.createWriteStream(path.join(opts.originalsDir, filename));

				async.parallel([
					copyFile.bind(null, filepath, backupStream),
					generateCompressFn(size, filepath, resizeStream)
				], opts.callback);
			});
		});
	});
}

start({
	watchDir: process.argv[2],
	compressedDir: process.argv[3],
	originalsDir: process.argv[4],
});

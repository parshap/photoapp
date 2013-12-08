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
	resizeWidthThreshold: 1500,
	resizeHeightThreshold: 1500,
};

/**
 * [opts.watchDir]
 * [opts.compressedDir]
 * [opts.originalsDir]
 * [opts.outputSize]
 * [opts.minOuputSize]
 * [opts.resizeWidthThreshold]
 * [opts.resizeHeightThreshold]
 *
 * @param {Object} opts
 */
function start(opts, callback) {
	opts = _.extend(DEFAULTS, opts || {});

	/**
	 * Whether the image should be resized
	 *
	 * @param {Object} size
	 */
	function shouldResize(size) {
		return (size.width > opts.resizeWidthThreshold || size.height > opts.resizeHeightThreshold);
	}

	fs.watch(opts.watchDir, function(event, filename) {
		console.log("change: %s file: %s", event, filename);
		if (!shouldHandle(filename)) {
			return;
		}

		var filepath     = path.join(__dirname, opts.watchDir, filename);
		var resizeStream = fs.createWriteStream(path.join(opts.compressedDir, filename));
		var backupStream = fs.createWriteStream(path.join(opts.originalsDir, filename));

		imagesize(fs.createReadStream(filepath), function(err, size) {
			if (err) {
				console.error(err);
				return;
			}

			// default compressFn to just move the file to the compressedDir
			console.log('filepath = %s', filepath);
			var backupFn = copyFile.bind(null, filepath, backupStream);
			var compressFn = copyFile.bind(null, filepath, resizeStream);

			if (shouldResize(size)) {
				// compress fn should actually compress the file
				var newSize = scaleSize(size, opts.outputSize, opts.minOutputSize)
				compressFn = compressAndMove.bind(null, {
					file: filepath,
					output: resizeStream,
					height: newSize.height,
					width: newSize.width
				});
			}

			async.parallel([
				compressFn,
				backupFn
			], callback);
		});
	});
}

start({
	watchDir: process.argv[2],
	compressedDir: process.argv[3],
	originalsDir: process.argv[4],
});

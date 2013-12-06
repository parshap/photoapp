var RESIZE_WIDTH_THRESHOLD = 1500;
var RESIZE_HEIGHT_THRESHOLD = 1500;

var fs = require('fs');
var path = require('path');
var gm = require('gm');
var through = require('through');
var async = require('async');

function start(watchDir, compressedDir, originalsDir) {
	function shouldHandle(filename) {
		return /\.(?:jpg|jpeg|png)$/i.test(filename);
	}

	fs.watch(watchDir, function(event, filename) {
		console.log("change: %s file: %s", event, filename);
		if (!shouldHandle(filename)) {
			return;
		}

		var filepath = path.join(__dirname, watchDir, filename);

		fs.stat(filepath, function(err, stats) {
			if (err || !stats.isFile()) {
				return;
			}

			var resizeStream = fs.createWriteStream(path.join(compressedDir, filename));
			var backupStream = fs.createWriteStream(path.join(originalsDir, filename));

			async.parallel([
				compressAndMove.bind(null, filepath, resizeStream),
				copyFile.bind(null, filepath, backupStream),
			], function(err, results) {
				if (err) {
					console.log(err);
					return;
				}
				fs.unlink(filepath);
			});
		});
	});
}

/**
 * Returns an size object scaled by some factor
 * @param {Object} size
 * @param {Float} factor
 */
function scaleSize(size, to) {
	var min = Math.min(size.width, size.height);

	return {
		height: Math.floor(size.height * factor),
		width: Math.floor(size.width * factor),
	}
}

/**
 * Whether the image should be resized
 *
 * @param {Object} size
 */
function shouldResize(size) {
	return (size.width > RESIZE_WIDTH_THRESHOLD || size.height > RESIZE_HEIGHT_THRESHOLD);
}

function copyFile(file, outputStream, callback) {
	fs.createReadStream(file)
		.pipe(outputStream);

	outputStream.on('error', callback);
	outputStream.on('end', function() {
		callback(null);
	});
}

function compressAndMove(file, resize, callback) {
	console.log("compressAndMove for file: %s", file);
	resize.on('end', function() {
		callback(null);
	});

	gm(file)
		.size({ bufferStream: true }, function(err, size) {
			if (err) {
				console.error('error getting size: %s', err);
				return;
			}

			if (shouldResize(size)) {
				var newSize = scaleSize(size, .25);
				this.resize(newSize.width, newSize.height)
					.stream()
					.pipe(resize);
			} else {
				this.stream()
					.pipe(resize);
			}
		});
}

var watchDir = process.argv[2];
var compressedDir = process.argv[3];
var originalsDir = process.argv[4];

start(watchDir, compressedDir, originalsDir);

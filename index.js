var _ = require('underscore')
var fs = require('fs');
var path = require('path');
var async = require('async');
var copyFile = require('./lib/copy-file');
var compress = require('./lib/compress');
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

	// Read files
	var files = watcher(opts.watchDir)
		.pipe(reader());

	// Write originals
	files.pipe(s3backer());
	files.pipe(dirbacker(opts.originalsDir));

	// Write compressed
	files.pipe(compressor(opts))
		.pipe(dirbacker(opts.compressedDir))
}

// Create stream that emits a data event for each file change
function watcher(dest) {
}

// Create a stream that consumes data from a watcher stream and emits a read
// stream for each of those files
function reader() {
}

// Consume read streams from reader and emit a compressed read stream 
function compressor(opts) {
	return through(function(stream) {
		this.emit("data", compress(stream, opts))
	});
}

// Backup to s3 - backup each read stream to s3
function s3backer(opts) {
}

// Backup to directory
function dirbacker(dest) {
}

start({
	watchDir: process.argv[2],
	compressedDir: process.argv[3],
	originalsDir: process.argv[4],
});

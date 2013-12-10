var gm = require('gm');
var imagesize = require('imagesize');
var buffer = require('stream-buffer');
var through = require('through');
var sizescaler = require("./sizescaler.js");

// Take an image stream compress it, and return a new stream for the
// compressed data. `stream.path` must have the filename for
// graphicsmagick to deduce the image format from.
module.exports = function(stream, opts) {
	// Create a stream to eventually output data to
	var output = through();

	// Get the file path of the input stream - needed later for gm
	var path = stream.path;

	// Store the stream in a buffer because the data will need to be
	// read twice. Once for determining the current size, and then
	// again for gm to resize.
	stream = stream.pipe(buffer());

	// Get image size and scale the image and output
	imagesize(stream, function(err, size) {
		if (err) return output.emit("error", err);

		if (size = scaler(size, opts)) {
			// Resize the image and pipe to output
			return gm(stream.replay(through()), path)
				.resize(size.width, size.height)
				.stream()
				.pipe(output);
		}
		else {
			// No resize necessary, just pipe the original image to
			// output
			stream.replay(output);
		}
	});

	return output;
};

function scaler(size, opts) {
	// Determine if this size needs to be resized at all
	if (size.width <= opts.widthThreshold &&
		size.height <= opts.heightThreshold) {
		return false;
	}

	return sizescaler(size, opts.outputSize, opts.minOutputSize);
}

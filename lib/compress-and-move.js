var gm = require('gm');

/**
 * [opts.input] (optional) input stream
 * [opts.output] output stream
 * [opts.filename] filename (must be supplied even if input is present)
 * [opts.height]
 * [opts.width]
 *
 * @param {Object} opts
 * @param {Function} callback
 */
function compressAndMove(opts) {
	console.log("compressAndMove for file: %s", opts.file);

	var args = [opts.file];
	if (opts.input) {
		// if input is set then make it the first argument
		args.unshift(opts.input);
	}

	return gm.apply(null, args)
		.resize(opts.width, opts.height)
		.stream();
}

module.exports = compressAndMove;

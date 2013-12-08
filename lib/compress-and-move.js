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
function compressAndMove(opts, callback) {
	console.log("compressAndMove for file: %s", opts.file);
	opts.output.on('end', function() {
		console.log('compressAndMove end');
		callback(null);
	});

	var args = [opts.file];
	if (opts.input) {
		// if input is set then make it the first argument
		args.unshift(opts.input);
	}

	gm.apply(null, args)
		.resize(opts.width, opts.height)
		.stream(function(err, stdout, stderr) {
			if (err) {
				callback(err);
			}

			stdout.pipe(opts.output);
			stdout.on('end', function() {
				callback(null);
			});
		});
}

module.exports = compressAndMove

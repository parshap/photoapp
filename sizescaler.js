/**
 * Returns an size object scaled by some factor
 * @param {Object} size
 * @param {Float} factor
 */
function scaleSize(size, target) {
	var min = Math.min(size.width, size.height);
	var factor = findScale(min, target);

	return {
		height: Math.floor(size.height * factor),
		width: Math.floor(size.width * factor),
	}
}

function findScale(orig, target, min) {
	var i = 0;
	var diff = orig;
	var prev = diff + 1;
	var size = (orig / (i+1));
	var check = min
		? function() {
			return (prev >= diff && size > min);
		}
		: function() {
			return (prev >= diff);
		}
	
	for (; check(); i++) {
		size = (orig / (i + 1));
		prev = diff;
		diff = Math.abs(size - target);
		console.log('prev: %d, diff: %d', prev, diff);
	}
	return (1 / (i - 1));
}

var width = process.argv[2];
var height = process.argv[3];
var guess = process.argv[4];

var out = scaleSize({
	width: width,
	height: height,
}, guess);

console.log(out);

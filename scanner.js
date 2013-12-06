var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var util = require('util');
var checksum = require('checksum');
var path = require('path');
var concat = require('concat-stream');
var Exift = require('exift');

function mapFsStat(filenames, cb) {
	function iter(item, finish) {
		fs.stat(item, function(err, stat) {
			finish(null, _.extend({
				path: item,
			}, stat));
		});
	}

	async.mapSeries(filenames, iter, cb);
}

function mapChecksum(filenames, cb) {
	function iter(item, finish) {
		checksum.file(item, function(err, sum) {
			finish(null, {
				path: item,
				sum: sum
			});
		});
	}

	async.mapSeries(filenames, iter, cb);
}

function canGetExif(filename) {
	var ext = path.extname(filename);
	return /\.(?:jpg|jpeg|gif|png)/i.test(path.extname(filename));
}

function mapExif(filenames, cb) {
	var exif = new Exift();
	function iter(item, finish) {
		exif.readData(item, function(err, data) {
			finish(null, {
				path: item,
				exif: data
			});
		});
	}

	async.mapSeries(filenames, iter, cb);
}

function filterExif(data, cb) {
	function iter(item, finish) {
		finish(!!item.exif);
	}

	async.filter(data, iter, function(results) {
		cb(null, results);
	});
}

function mapValue(data, key) {
	return data.map(function(item) {
		return item[key];
	});
}

function mapModifyDate(data) {
	return data.map(function(item) {
		return item.exif.ModifyDate;
	});
}

function scan() {
	var sourceDir = process.argv[2];
	var checkDir = process.argv[3];

	var sourceFilesAbs = sourceFiles.map(function(item) {
		return path.join(sourceDir, item);
	});

	var checkFilesAbs = checkFiles.map(function(item) {
		return path.join(checkDir, item);
	});

	var sourceFiles = fs.readdirSync(sourceDir);
	var checkFiles = fs.readdirSync(checkDir);
	async.series([
		async.waterfall.bind(null, [
			mapExif.bind(null, sourceFilesAbs),
			filterExif
		]),
		async.waterfall.bind(null, [
			mapExif.bind(null, checkFilesAbs),
			filterExif
		])
	], function(err, results) {
		//console.log(results);
		//var sourceMap = _.indexBy(results.source, 'sum');
		//var checkMap = _.indexBy(results.check, 'sum');

		var source = mapModifyDate(results[0]);
		var check = mapModifyDate(results[1]);

		//console.log(sourceSums);
		//console.log(checkSums);
		console.log("Found %d files in %s", _.size(source), sourceDir);
		console.log("Found %d files in %s", _.size(check), checkDir);

		var diff = _.difference(source, check);

		console.log("Found %d files in %s not in %s", _.size(diff), sourceDir, checkDir);

		console.log(JSON.stringify(diff));

		//process.stdout.write(JSON.stringify(diff.map(function(sum) {
			//return sourceMap[sum];
		//})));
	});
}

function mapFindModified(data, sourceDir, callback) {
	function createIter(exif) {
		return function iter(item, finish) {
			finish(_.find(exif, function(item) {
				return (item.exif.ModifiedDate == item);
			}));
		}
	}

	var sourceFilesAbs = fs.readdirSync(sourceDir).map(function(item) {
		return path.join(sourceDir, item);
	});
	async.waterfall([
		mapExif.bind(null, sourceFilesAbs),
		filterExif
	], function(err, results) {
		console.log('waterfall done');
		console.log(results);
		var iter = createIter(results);
		async.map(data, iter, callback);
	});
}

process.stdin.pipe(concat(function(json) {
	console.log('concat pipe');
	var data = JSON.parse(json.toString());

	console.log(data);
	//mapFindModified(json, process.argv[2], function(err, results) {
		//console.log(JSON.stringify(results));
	//});
}));
//mapFindModified(JSON.parse(process.stdin));

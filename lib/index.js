'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.jsdoc = jsdoc;

var _mapStream = require('map-stream');

var _mapStream2 = _interopRequireDefault(_mapStream);

var _tmp = require('tmp');

var _tmp2 = _interopRequireDefault(_tmp);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var os = require('os').type();

var debug = require('debug')('gulp-jsdoc-generator');

/**
 * @callback gulpDoneCallback
 */

/**
 * A wrapper around jsdoc cli.
 *
 * This function collects all filenames. Then runs:
 * ```jsdoc -c config -t node_modules/ink-docstrap/template gulpFile1 gulpFile2```
 * @example
 * gulp.src(['README.md', 'src/*.js']), {read: false}).pipe(
 *     jsdoc(options, cb)
 * );
 *
 * @param {Object} [config=require('./jsdocConfig.json')]
 * @param {gulpDoneCallback} done
 * @returns {*|SignalBinding}
 */
function jsdoc(config, done) {
    var files = [];
    var jsdocConfig = void 0;

    // User just passed callback
    if (arguments.length === 1 && typeof config === 'function') {
        done = config;
        config = undefined;
    }

    // Prevent some errors
    if (typeof done !== 'function') {
        done = function done() {};
    }

    jsdocConfig = config || require('./jsdoc.json');

    debug('Config:\n' + JSON.stringify(jsdocConfig, undefined, 2));

    return (0, _mapStream2.default)(function (file, callback) {
        files.push(file.path);
        callback(null, file);
    }).on('end', function () {
        // We use a promise to prevent multiple dones (normal cause error then close)
        new _bluebird2.default(function (resolve, reject) {
            if (files.length === 0) {
                var errMsg = 'JSDoc Error: no files found to process';
                _gulpUtil2.default.log(_gulpUtil2.default.colors.red(errMsg));
                _gulpUtil2.default.beep();
                reject(new Error(errMsg));
            }

            var tmpobj = _tmp2.default.fileSync();
            debug('Documenting files: ' + files.join(' '));
            _fs2.default.writeFile(tmpobj.name, JSON.stringify(jsdocConfig), 'utf8', function (err) {
                // We couldn't write the temp file
                if (err) {
                    reject(err);
                }

                var spawn = require('child_process').spawn,
                    cmd = require.resolve('jsdoc/jsdoc.js'); // Needed to handle npm3 - find the binary anywhere

                var args = ['-c', tmpobj.name];

                // Config + ink-docstrap if user did not specify their own layout or template
                if (!(jsdocConfig.opts && jsdocConfig.opts.template) || !(jsdocConfig.templates && jsdocConfig.templates.default && jsdocConfig.templates.default.layoutFile)) {} else if (jsdocConfig.opts && jsdocConfig.opts.template) {
                    var templatePath = void 0;
                    try {
                        templatePath = _path2.default.dirname(require.resolve(jsdocConfig.opts.template));
                    } catch (e) {
                        templatePath = _path2.default.resolve(jsdocConfig.opts.template);
                    }
                    args = args.concat(['-t', templatePath]);
                }

                args = args.concat(files);

                debug(cmd + ' ' + args.join(' '));

                var child = os === 'Windows_NT' ? spawn(process.execPath, [cmd].concat(args), { cwd: process.cwd() }) : spawn(cmd, args, { cwd: process.cwd() }); // unix
                child.stdout.setEncoding('utf8');
                child.stderr.setEncoding('utf8');
                child.stdout.on('data', function (data) {
                    _gulpUtil2.default.log(data);
                });
                child.stderr.on('data', function (data) {
                    _gulpUtil2.default.log(_gulpUtil2.default.colors.red(data));
                    _gulpUtil2.default.beep();
                });
                child.on('close', function (code) {
                    if (code === 0) {
                        _gulpUtil2.default.log('Documented ' + files.length + ' files!');
                        resolve();
                    } else {
                        _gulpUtil2.default.log(_gulpUtil2.default.colors.red('JSDoc returned with error code: ' + code));
                        _gulpUtil2.default.beep();
                        reject(new Error('JSDoc closed with error code: ' + code));
                    }
                });
                child.on('error', function (error) {
                    _gulpUtil2.default.log(_gulpUtil2.default.colors.red('JSDoc Error: ' + error));
                    _gulpUtil2.default.beep();
                    reject(new Error(error));
                });
            });
        }).asCallback(done);
    });
}
module.exports = jsdoc;
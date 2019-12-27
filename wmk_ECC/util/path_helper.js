/**
 * Created by wangxh on 2017/7/19.
 */

'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var path_config = require('../config/path_config');

var appPath = path.normalize(path.join(__dirname, '..'));
var rootPath = path.normalize(path.join(__dirname, '../../'));

var cachePath = path.resolve(path_config.cache);
var dataPath = path.resolve(path_config.data);
var logPath = path.resolve(path_config.logs);
var webPath = path.resolve(path_config.web);

function ensure_path(dir) {
    if(!fs.existsSync(dir)){
        ensure_path(path.dirname(dir));
        fs.mkdirSync(dir);
    }
}

ensure_path(cachePath);
ensure_path(dataPath);
ensure_path(logPath);

module.exports = {
    appPath: appPath,
    rootPath: rootPath,
    cachePath: cachePath,
    dataPath: dataPath,
    logPath: logPath,
    webPath: webPath,

    ensure_path: ensure_path
};
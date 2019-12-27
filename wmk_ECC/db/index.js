/**
 * Created by wangxh on 2017/3/29.
 */

'use strict';

var maindb = require('./main');
var datadb = require('./data');

var ah = require('../util/array_helper');

var _exports = maindb.adapters;

module.exports = _exports;
_exports.datadb = datadb.adapters;

var ramdb = require('./ram');
_exports.ramdb = ramdb;

module.exports.init = function (param, done) {
    ah.series([function (cb) {
        maindb.init(param, cb);
    }, function (cb) {
        datadb.init(param, cb);
    }, function (cb) {
        ramdb.init(param, cb);
    }], function (err) {
        done(err);
    });
};
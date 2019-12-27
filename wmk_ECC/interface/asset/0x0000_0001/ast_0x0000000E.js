/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var db = require('../../../db/index');
var ast = db.ast;

function handle(req, res, body, callback) {
    var rdbAST = db.ramdb.ast;

    var res = rdbAST.get_all_asset_type();

    callback(null, res);
}

module.exports.cmd = cmd.ast_0x0000000E;
module.exports.handle = handle;
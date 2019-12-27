/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');
var dbAssetLog = db.datadb.astLog;

function handle(req, res, body, callback) {
    dbAssetLog.collection.find({}, {_id: 0, aNO: 1, action: 1, time: 1}).sort({time: -1}).limit(50).toArray(function (err, results) {
        if(err) logger.error(err);
        callback(null, results);
    });
}

module.exports.cmd = cmd.ast_0x00020005;
module.exports.handle = handle;
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var db = require('../../../db/index');
var dbAsset = db.asset;
var dbAssetLog = db.datadb.astLog;

function handle(req, res, body, callback) {
    dbAsset.findOne({aNO: body.aNO}, {_id: 0, _state: 0}, function (err, data) {
        if(err) return callback(err);
        if(data){
            dbAssetLog.find_log({aNO: body.aNO}, {_id: 0}, function (err, results) {
                if(err) logger.error(err);
                callback(null, {asset: data, operationList: results});
            })
        }else{
            callback({status: code.not_found});
        }
    })
}

module.exports.cmd = cmd.ast_0x00000017;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        aNO: {type: 'string', required: true}
    }
};
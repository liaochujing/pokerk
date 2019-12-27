/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var PartState = require('../../../modules/asset/definition/part_state');
var AssetAction = require('../../../modules/asset/definition/asset_action');
var db = require('../../../db/index');
var dbParts = db.parts;
var dbAssetLog = db.datadb.astLog;

function handle(req, res, body, callback) {
    var operation = body.option || {};
    operation.user = req.user.id;
    operation.id = body.id;

    dbParts.set_parts_asset(body.id, PartState.used, body.aNO, function (err, data) {
        if(err) return callback(err);

        if(data.nModified > 0){
            dbAssetLog.insert_log(body.aNO, AssetAction.part_unstorage, operation, new Date(), function (err) {
                if(err) logger.error(err);
            });

            callback(err);
        }else{
            callback({status: code.other, msg: 'part state not found or state error'});
        }
    })
}

module.exports.cmd = cmd.ast_0x00010005;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true},
        aNO: {type: 'string', required: true}
    }
};
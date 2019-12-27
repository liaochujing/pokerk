/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var PrivilegePoint = require('../../../definition/privilege_point');
var AssetState = require('../../../modules/asset/definition/asset_state');
var AssetAction = require('../../../modules/asset/definition/asset_action');

var db = require('../../../db/index');
var dbAsset = db.asset;
var dbAssetLog = db.datadb.astLog;
var rdbAsset = db.ramdb.asset;

function handle(req, res, body, callback) {
    var aNO = body.aNO;
    var operation = body.option || {};
    operation.user = req.user.id;

    var asset = rdbAsset.get_asset_sync(aNO);
    if(!asset){
        callback({status: code.not_found, msg: 'asset not found'});
        return;
    }

    var date = new Date(body.time);

    if(body.action == 0){//启用
        if(asset.state != AssetState.unused){
            callback({status: code.unknown, msg: 'asset state error'});
            return;
        }

        var now = new Date();
        dbAsset.asset_use(aNO, AssetState.used, date, now, function (err) {
            if(err) return callback(err);

            dbAssetLog.insert_log(aNO, AssetAction.use, operation, now, function (err) {
                if(err) logger.error(err);
            });
            asset.state = AssetState.used;
            asset.pdDate = now;

            callback();
        });
    }else{//停用
        if(asset.state != AssetState.used){
            callback({status: code.unknown, msg: 'asset state error'});
            return;
        }

        var now = new Date();
        dbAsset.asset_unuse(aNO, AssetState.unused, date, now, function (err) {
            if(err) return callback(err);

            dbAssetLog.insert_log(aNO, AssetAction.unuse, operation, now, function (err) {
                if(err) logger.error(err);
            });
            asset.state = AssetState.unused;
            asset.stDate = now;

            callback();
        });
    }
}

module.exports.privilege = PrivilegePoint.assetUse;
module.exports.cmd = cmd.ast_0x00010002;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        aNO: {type: 'string', required: true},
        action: {type: 'number', enum: [0, 1], required: true},
        time: {type: 'string', required: true}
    }
};
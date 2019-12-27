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

    if(body.action == 0){//出库
        if(!body.region){
            callback({status: code.password_error, msg: 'region is not found'});
            return;
        }
        if(asset.state != AssetState.storage){
            callback({status: code.unknown, msg: 'asset state error'});
            return;
        }

        var now = new Date();
        dbAsset.asset_unstorage(aNO, AssetState.unused, body.region, now, function (err) {
            if(err) return callback(err);

            dbAssetLog.insert_log(aNO, AssetAction.unstorage, operation, now, function (err) {
                if(err) logger.error(err);
            });
            asset.region = body.region;
            asset.state = AssetState.unused;
            asset.stDate = now;

            callback();
        });
    }else{//取消
        if(asset.state != AssetState.unused){
            callback({status: code.unknown, msg: 'asset state error'});
            return;
        }

        var now = new Date();
        dbAsset.asset_unstorage(aNO, AssetState.storage, null, now, function (err) {
            if(err) return callback(err);

            dbAssetLog.insert_log(aNO, AssetAction.storage, operation, now, function (err) {
                if(err) logger.error(err);
            });
            asset.region = undefined;
            asset.state = AssetState.storage;

            callback();
        });
    }
}

module.exports.cmd = cmd.ast_0x00010001;
module.exports.handle = handle;
module.exports.privilege = PrivilegePoint.outStorage;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        aNO: {type: 'string', required: true},
        action: {type: 'number', enum: [0, 1], required: true},
        option: {type: 'object'},
        region: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            }
        }
    }
};
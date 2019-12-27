/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var logger = require('../../../util/log_manager').logger;
var objectHelper = require('../../../objects/object_helper');

var PrivilegePoint = require('../../../definition/privilege_point');
var AssetState = require('../../../modules/asset/definition/asset_state');
var AssetAction = require('../../../modules/asset/definition/asset_action');
var db = require('../../../db/index');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

function handle(req, res, body, callback) {
    var user = req.user;

    var dbAssetLog = db.datadb.astLog;
    var rdbAsset = db.ramdb.asset;
    var _asset = rdbAsset.get_asset_sync(body.aNO);
    if(_asset){
        callback({status: code.asset_no_dup});
        return;
    }

    var asset = objectHelper.createNameObject(uiclassID.asset);

    body.type = body.type || {};

    asset.aNO = body.aNO;
    asset.type = {system: body.type.system, group: body.type.group};
    asset.name = body.name;
    asset.brand = body.brand;
    asset.model = body.model;
    asset.ratedPower = body.ratedPower;
    asset.supplier = body.supplier;
    asset.mcycle = body.mcycle;
    asset.ucycle = body.ucycle;
    if(body.wlife){
        asset.wlife = new Date(body.wlife);
    }
    if(body.pdDate){
        asset.pdDate = new Date(body.pdDate);
    }
    if(body.stDate){
        asset.stDate = new Date(body.stDate);
    }
    if(body.purDate){
        asset.purDate = new Date(body.purDate);
    }
    asset.option = body.option;

    asset._state = 0;
    asset.state = AssetState.storage;

    asset.insert_db(function (err) {
        if(err){
            logger.error(err);
            var _c = code.unknown;
            var message = err.message;
            if(err.code == 11000){//重复键
                _c = code.asset_no_dup;
            }
            callback({status: _c});
        }else{
            dbAssetLog.clear_log(asset.aNO, function (err) {
                if(err) logger.error(err);
                dbAssetLog.insert_log(asset.aNO, AssetAction.storage, {user: user.id}, new Date(), function (err) {
                    if(err) logger.error(err);
                });
            });

            rdbAsset.set_asset(asset);
            notifyHelper.send_notify(new NotifyMsg(NotifyType.asset_created, asset));

            callback();
        }
    })
}

module.exports.privilege = PrivilegePoint.inStorage;
module.exports.cmd = cmd.ast_0x00000001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        aNO: {type: 'string', required: true},
        name: {type: 'string', required: true},
        type: {
            type: 'object',
            properties: {
                system: {type: 'number', required: true},
                group: {type: 'number', required: true}
            },
            required: true
        },
        brand: {type: 'string'},
        model: {type: 'string'},
        ratedPower: {type: 'number'},
        supplier: {type: 'number'},
        mcycle: {type: 'number'},
        ucycle: {type: 'number'},
        wlife: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'},
        pdDate: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'},
        stDate: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'},
        purDate: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'},
        option: {type: 'object'}
    }
};
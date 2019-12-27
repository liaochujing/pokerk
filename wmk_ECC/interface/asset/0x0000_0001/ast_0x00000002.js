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
var dbAsset = db.asset;
var rdbAsset = db.ramdb.asset;

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

function handle(req, res, body, callback) {
    if(body.wlife){
        body.wlife = new Date(body.wlife);
    }
    if(body.pdDate){
        body.pdDate = new Date(body.pdDate);
    }
    if(body.stDate){
        body.stDate = new Date(body.stDate);
    }
    if(body.purDate){
        body.purDate = new Date(body.purDate);
    }

    var _asset = rdbAsset.get_asset_sync(body.aNO);
    if(_asset){
        var now = new Date();
        dbAsset.update_asset(
            body.aNO,
            body.name,
            body.model,
            body.type,
            body.ratedPower,
            body.brand,
            body.supplier,
            body.mcycle,
            body.ucycle,
            body.wlife,
            body.purDate,
            body.pdDate,
            body.stDate,
            body.region,
            body.option,
            now, function (err) {
                if(err) {
                    logger.error(err);
                    callback(err);
                    return;
                }

                if(body.name !== undefined){
                    _asset.name = body.name;
                }
                if(body.model !== undefined){
                    _asset.model = body.model;
                }
                if(body.type !== undefined){
                    _asset.type = body.type;
                }
                if(body.ratedPower !== undefined){
                    _asset.ratedPower = body.ratedPower;
                }
                if(body.brand !== undefined){
                    _asset.brand = body.brand;
                }
                if(body.supplier !== undefined){
                    _asset.supplier = body.supplier;
                }
                if(body.mcycle !== undefined){
                    _asset.mcycle = body.mcycle;
                }
                if(body.ucycle !== undefined){
                    _asset.ucycle = body.ucycle;
                }
                if(body.wlife !== undefined){
                    _asset.wlife = body.wlife;
                }
                if(body.purDate !== undefined){
                    _asset.purDate = body.purDate;
                }
                if(body.pdDate !== undefined){
                    _asset.pdDate = body.pdDate;
                }
                if(body.stDate !== undefined){
                    _asset.stDate = body.stDate;
                }
                if(body.region !== undefined){
                    _asset.region = body.region;
                }
                if(body.option !== undefined){
                    _asset.option = body.option;
                }

                rdbAsset.set_asset(_asset);
                notifyHelper.send_notify(new NotifyMsg(NotifyType.asset_modified, _asset));

                callback();
        });
    }else{
        var user = req.user;
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
        asset.wlife = body.wlife;
        asset.pdDate = body.pdDate;
        asset.stDate = body.stDate;
        asset.purDate = body.purDate;
        asset.option = body.option;
        asset.operationList = [{type: AssetAction.storage, user: user.id, time: new Date()}];

        asset.state = AssetState.storage;

        asset.insert_db(function (err) {
            if(err){
                logger.error(err);
                var _c = code.unknown;
                var message = err.message;
                if(err.code == 11000){
                    _c = code.asset_no_dup;
                }
                callback({status: _c});
            }else{

                rdbAsset.set_asset(asset);
                notifyHelper.send_notify(new NotifyMsg(NotifyType.asset_modified, asset));

                callback(null, {createTime: asset.createTime});
            }
        });
    }
}

module.exports.get_privilege_point = function (body, done) {
    var _point = undefined;
    var _asset = rdbAsset.get_asset_sync(body.aNO);
    if(_asset){
        _point = PrivilegePoint.modifyAsset;
    }else{
        _point = PrivilegePoint.inStorage;
    }
    done(null, _point);
};

module.exports.cmd = cmd.ast_0x00000002;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        aNO: {type: 'string', required: true},
        name: {type: 'string'},
        type: {
            type: 'object',
            properties: {
                system: {type: 'number', required: true},
                group: {type: 'number', required: true}
            }
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
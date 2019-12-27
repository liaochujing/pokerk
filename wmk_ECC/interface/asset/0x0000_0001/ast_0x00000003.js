/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var objectHelper = require('../../../objects/object_helper');

var PrivilegePoint = require('../../../definition/privilege_point');
var ObjectState = require('../../../definition/object_state');
var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

var db = require('../../../db/index');
var dbAsset = db.asset;
var rdbAsset = db.ramdb.asset;

function handle(req, res, body, callback) {
    if(body.action == 0){//删除
        var asset = rdbAsset.get_asset_sync(body.aNO);
        if(!asset){
            callback({status: code.not_found, msg: 'asset not found'});
            return;
        }

        dbAsset.update_asset_state(body.aNO, ObjectState.deleted, function (err) {
            if(err){
                callback({status: code.unknown, msg: err.message});
            }else{
                rdbAsset.del_asset(body.aNO);
                notifyHelper.send_notify(new NotifyMsg(NotifyType.asset_removed, {aNO: body.aNO}));

                callback();
            }
        });
    }else{//恢复
        dbAsset.update_asset_state(body.aNO, ObjectState.normal, function (err) {
            if(err){
                callback(err);
            }else{
                dbAsset.find_assets({aNO: body.aNO}, {_id: 0}, function (err, results) {
                    if(err) {
                        callback(err);
                    }else{
                        if(results && results.length > 0){
                            var data = results[0];

                            var asset = objectHelper.createNameObject(uiclassID.asset);
                            asset.init_from_row(data);

                            rdbAsset.set_asset(asset);
                            notifyHelper.send_notify(new NotifyMsg(NotifyType.asset_created, asset));

                            callback();
                        }else{
                            callback({status: code.not_found, msg: 'asset not found'});
                        }
                    }
                });
            }
        });
    }
}

module.exports.privilege = PrivilegePoint.removeAsset;
module.exports.cmd = cmd.ast_0x00000003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        aNO: {type: 'string', required: true},
        action: {type: 'number', enum: [0, 1], required: true}
    }
};
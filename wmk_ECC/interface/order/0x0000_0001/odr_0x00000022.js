/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var objectHelper = require('../../../objects/object_helper');

var cfgKey = require('../../../modules/order/definition/system_config_key');
var privilegePoint = require('../../../definition/privilege_point');
var OrderState = require('../../../modules/order/definition/order_state');
var OrderAction = require('../../../modules/order/definition/order_action_type');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var objID = db.objID;
var rdbOrder = db.ramdb.order;
var dbOPL = db.datadb.opl;

// const MaintainType = {
//     year: 1,
//     quarter: 2,
//     month: 3
// };



function _gen_order(order, callback) {
    if(!order.id){
        objID.gen_object_id('order', function (err, id) {
            if(err){
                logger.error({msg: 'gen order id failed', order: order, err: err});
                callback(err);
                return;
            }
            order.id = id;
            order.insert_db(function (err) {
                if(err){
                    logger.error({msg: 'insert order failed', order: order, err: err});
                    callback();
                    return;
                }

                //更新缓存
                rdbOrder.set_order(order);

                callback();
            })
        });
    }else{
        order.update_db(function (err) {
            if(err){
                logger.error({msg: 'insert order failed', order: order, err: err});
                callback(err);
                return;
            }

            //更新缓存
            // rdbOrder.set_order(order);

            callback();
        })
    }
}

function handle(req, res, body, callback) {

    var dbAsset = db.asset;
    var rdbCFG = db.ramdb.cfg;

    var user = req.user;

    var fullName = body.name;
    var config = rdbCFG.get_system_config(cfgKey.maintain);
    if(config){
        fullName = config.option.format.replace('{Name}', body.asset.name || '').replace('{MTime}', body.planTime.substring(0, 10));
    }

    var order = undefined;
    if(body.serverNO != undefined){
        order = ramdb.order.get_order_sync(body.serverNO, body.classID, body.id);
        if(!order){
            callback({status: code.not_found, msg: 'order not found'});
            return;
        }
        if(order.state != OrderState.draft){
            callback({status: code.unknown, msg: 'order not in draft state'});
            return;
        }
    }else{
        order = objectHelper.createNameObject(uiclassID.assetOrder)
    }

    dbAsset.find_assets({aNO: body.asset.aNO}, {region: 1}, function (err, results) {
        if(err) {
            logger.error(err);
            callback({status: code.unknown});
            return;
        }

        var asset = undefined;
        if(results && results.length > 0){
            asset = results[0];
        }
        if(!asset){
            callback({status: code.not_found, msg: '资产未找到'});
            return;
        }
        
        if(asset.region){
            order.region = asset.region;
        }else{
            var nameObject = db.ramdb.no.get_by_asset_no(body.asset.aNO);
            if(nameObject){
                order.region = {serverNO: nameObject.serverNO, classID: nameObject.classID, id: nameObject.id};
            }
        }

        order.name = body.name;
        order.fullName = fullName;
        order.level = body.level;
        order.recipient = body.recipient;
        order.sponsor = user.id;//发起人
        order.step = 1;
        order.state = OrderState.draft;
        order.operationList = [];
        order.users = [];
        // if(!order.operationList){//无需缓存，之前操作记录
        //     order.operationList = []
        // }
        // if(!order.users){
        //     order.users = [];
        // }
        if(!order.createTime){
            order.createTime = new Date();
        }

        order.restData = {
            type: body.type,
            asset: {
                aNO: body.asset.aNO,
                name: body.asset.name
            },
            maintain: body.maintain,
            template: body.template,
            timeSlot: body.timeSlot,
            planTime: new Date(body.planTime)
        };

        _gen_order(order, function (err) {
            if(err) return callback({status: code.unknown});

            if(!body.id){
                dbOPL.insert_user_log(OrderAction.add_order, user, '创建维护工单:' + order.fullName, req.body, new Date())
            }else{
                dbOPL.insert_user_log(OrderAction.modify_order, user, '修改维护工单:' + order.fullName, req.body, new Date())
            }

            callback(null, {id: order.id, state: order.state, createTime: order.createTime});
        });
    });
}

module.exports.privilege = privilegePoint.addOrder;
module.exports.cmd = cmd.odr_0x00000022;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number'},
        classID: {type: 'number'},
        id: {type: 'number'},
        name: {type: 'string'},
        level: {type: 'number', required: true},
        asset: {
            type: 'object',
            properties: {
                aNO: {type: 'string', required: true},
                name: {type: 'string', required: true}
            },
            required: true
        },
        type: {type: 'number', enum: [1,2,3], required: true},
        recipient: {type: 'number', required: true},
        template: {type: 'object', required: true},
        // content: {type: 'string', required: true},
        maintain: {type: 'number', required: true},
        timeSlot: {
            type: 'object',
            properties: {
                start: {type: 'string', required: true},
                end: {type: 'string', required: true}
            },
            required: true
        },
        planTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true}
    }
};
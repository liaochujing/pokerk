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
                    callback(err);
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
                callback();
                return;
            }

            //更新缓存
            // rdbOrder.set_order(order);

            callback();
        })
    }
}

function handle(req, res, body, callback) {
    var user = req.user;
    
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
        order = objectHelper.createNameObject(uiclassID.customOrder)
    }

    order.name = body.name;
    order.fullName = body.name;
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
    order.region = body.area;

    order.restData = {
        type: body.type,
        data: body.data
    };

    _gen_order(order, function (err) {
        if(err) return callback({status: code.unknown});

        if(!body.id){
            dbOPL.insert_user_log(OrderAction.add_order, user, '创建自定义工单:' + order.fullName, req.body, new Date())
        }else{
            dbOPL.insert_user_log(OrderAction.modify_order, user, '修改自定义工单:' + order.fullName, req.body, new Date())
        }

        callback(null, {serverNO: order.serverNO, classID: order.classID, id: order.id, state: order.state, createTime: order.createTime});
    });
}

module.exports.privilege = privilegePoint.addOrder;
module.exports.cmd = cmd.odr_0x00000031;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number'},
        classID: {type: 'number'},
        id: {type: 'number'},
        name: {type: 'string', required: true},
        level: {type: 'number', required: true},
        recipient: {type: 'number', required: true},
        area: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            }
        },
        type: {type: 'number', required: true},
        data: {type: 'object'}
    }
};
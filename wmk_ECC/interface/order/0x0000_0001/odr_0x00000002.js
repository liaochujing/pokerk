/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');

var privilegePoint = require('../../../definition/privilege_point');
var OrderState = require('../../../modules/order/definition/order_state');
var OrderAction = require('../../../modules/order/definition/order_action_type');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var dbOrder = db.order;

function handle(req, res, body, callback) {
    var user = req.user;
    var order = ramdb.order.get_order_sync(body.serverNO, body.classID, body.id);
    if(order){
        if(order.state != OrderState.unreceived){
            callback({status: code.unknown, msg: '工单当前状态不可进行该操作!'});
            return;
        }

        var canReceive = true;
        // if(order.classID == uiclassID.alarmOrder){
            if(order.recipient != undefined){//指派给操作员
                if(order.recipient != user.id){
                    canReceive = false;
                }
            }else{
                if(order.group != user.group.id) {//指派给操作员组
                    canReceive = false;
                }
            }
        // }else{
        //     if(order.recipient != undefined){
        //         if(order.recipient != user.id){
        //             canReceive = false;
        //         }
        //     }
        // }
        if(!canReceive){
            callback({status: code.unknown, msg: '您无法处理此工单!'});
            return;
        }

        var now = new Date();
        var state = undefined;
        if(order.classID != uiclassID.alarmOrder && order.classID != uiclassID.inspectionOrder && order.step == 1){//回退，接收后变为草稿状态
            state = OrderState.draft;
        }else{
            state = OrderState.processing;
        }
        var operation = {action: OrderAction.receive, user: user.id, step: order.step, time: now};
        var recipient = user.id;

        dbOrder.receive_order(order.serverNO, order.classID, order.id, state, recipient, now, operation, function (err) {
            if(err) return callback({status: code.unknown, msg: 'update order failed'});

            order.state = state;
            order.operationList.push(operation);
            order.recipient = recipient;
            order.receiveTime = now;
            delete order.notifyInfo['handle'];

            callback(null, {id: order.id, state: order.state});
        })
    }else{
        callback({status: code.not_found, msg: 'order not found'});
    }
}

module.exports.privilege = privilegePoint.receiveOrder;
module.exports.cmd = cmd.odr_0x00000002;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
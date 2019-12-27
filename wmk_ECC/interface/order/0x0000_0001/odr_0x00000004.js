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

var orderNotifyHelper = require('../../../modules/order/processor/order_notify_processor');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var dbOrder = db.order;

function handle(req, res, body, callback) {
    var user = req.user;
    var order = ramdb.order.get_order_sync(body.serverNO, body.classID, body.id);
    if(order){
        if(order.recipient != undefined){
            if(order.recipient != user.id){
                callback({status: code.unknown, msg: '您无法处理此工单!'});
                return;
            }
        }
        if(order.state != OrderState.processing){
            callback({status: code.unknown, msg: '工单当前状态不可进行该操作!'});
            return;
        }

        //第一步工单无法回退
        if(order.step <= 1){
            callback({status: code.unknown, msg: '告警工单处于第一步，无法回退！'});
            return;
        }

        var step = order.step - 1;//步骤--
        var recipient = body.recipient;
        if(recipient == undefined){
            for(var i=order.operationList.length-1;i>=0;i--){
                var operation = order.operationList[i];
                if(operation.step == step && (operation.action == OrderAction.handle || operation.action == OrderAction.send)){
                    recipient = operation.user;
                    break;
                }
            }
        }
        if(recipient == null){
            callback({status: code.unknown, msg: '接收人无效！'});
            return;
        }

        var now = new Date();
        var state = OrderState.unreceived;
        var operation = {action: OrderAction.rollback, user: user.id, to: recipient, step: order.step, data: body.data, time: now};

        dbOrder.rollback_order(order.serverNO, order.classID, order.id, step, state, recipient, now, operation, function (err) {
            if(err) return callback({status: code.unknown, msg: 'update order failed'});

            order.step = step;
            order.state = state;
            order.recipient = recipient;
            order.operationList.push(operation);
            order.sendTime = now;
            order.receiveTime = undefined;
            delete order.notifyInfo['receive'];

            orderNotifyHelper.notify_receive(order, '工单退回,请及时处理');

            callback(null, {id: order.id, state: order.state});
        })
    }else{
        callback({status: code.not_found, msg: 'order not found'});
    }
}

module.exports.privilege = privilegePoint.rollbackOrder;
module.exports.cmd = cmd.odr_0x00000004;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        recipient: {type: 'number'},
        data: {type: 'object'}
    }
};
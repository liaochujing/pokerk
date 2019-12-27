/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

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

        var now = new Date();
        var state = OrderState.finished;
        var recipient = null;
        var operation = {action: OrderAction.finish, user: user.id, step: order.step + 1, data: body.data, time: now};

        dbOrder.finish_order(order.serverNO, order.classID, order.id, state, recipient, now, operation, function (err) {
            if(err) return callback({status: code.unknown, msg: 'update order failed'});

            order.state = state;
            order.recipient = recipient;
            order.operationList.push(operation);
            order.endTime = now;

            //清理已办结工单缓存
            ramdb.order.del_order(order);

            callback(null, {id: order.id, state: order.state});
        })
    }else{
        callback({status: code.not_found, msg: 'order not found'});
    }
}

module.exports.privilege = privilegePoint.finishOrder;
module.exports.cmd = cmd.odr_0x00000005;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        data: {type: 'object'}
    }
};
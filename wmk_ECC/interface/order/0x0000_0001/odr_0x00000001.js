/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var logger = require('../../../util/log_manager').logger;

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
        if(order.sponsor != user.id){
            callback({status: code.unknown, msg: 'only sponsor can send this order'});
            return;
        }
        if(order.state != OrderState.draft){
            callback({status: code.unknown, msg: 'order not in draft state'});
            return;
        }

        var now = new Date();
        var step = order.step + 1;
        var state = OrderState.unreceived;
        var recipient = order.recipient;
        var operation = {action: OrderAction.send, user: user.id, step: order.step, time: now};

        dbOrder.send_order(order.serverNO, order.classID, order.id, step, state, recipient, order.sponsor, now, operation, function (err) {
            if(err) return callback({status: code.unknown, msg: 'update order failed'});

            order.step = step;
            order.state = state;
            order.recipient = recipient;
            order.operationList.push(operation);
            order.sendTime = now;
            order.startTime = now;

            //更新资产关联的工单
            // if(order.classID == uiclassID.assetOrder){
            //     var dbAsset = db.asset;
            //     var aNO = order.restData.asset.aNO;
            //     if(aNO){
            //         dbAsset.add_related_order(aNO, {serverNO: order.serverNO, classID: order.classID, id: order.id}, function (err) {
            //             if(err) logger.error({msg: 'add asset related order failed', err: err, aNO: aNO, order: {serverNO: order.serverNO, classID: order.classID, id: order.id}});
            //         })
            //     }
            // }

            orderNotifyHelper.notify_receive(order, '新工单,请及时处理');

            callback(null, {id: order.id, state: order.state});
        })
    }else{
        callback({status: code.not_found, msg: 'order not found'});
    }
}

module.exports.privilege = privilegePoint.receiveOrder;
module.exports.cmd = cmd.odr_0x00000001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var OperatorState = require('../../../definition/operator_state');
var OrderState = require('../../../modules/order/definition/order_state');
var OperatorHelper = require('../../../modules/order/processor/operator_helper');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var user = req.user;
    var _user = db.ramdb.oo.get_by_identity(user);
    var isOnDuty = false;
    if(_user){
        isOnDuty = (_user.state == OperatorState.onDuty);
    }

    var dbOrder = db.order;
    var rdbOO = db.ramdb.oo;

    var isAdmin = (user.classID == uiclassID.admin || user.group.classID == uiclassID.adminGroup);

    var response = [];

    var buildings = db.ramdb.nor.get_child_identity(body.serverNO, body.classID, body.id, uiclassID.building);
    var mnoDic = {};
    mnoDic[body.serverNO] = 1;
    for(var i=0;i<buildings.length;i++){
        var item = buildings[i];
        mnoDic[item.serverNO] = 1;
    }

    var index = 0;
    var add_order = function (order) {
        if(index < 50){
            var recipientName = undefined;
            if(order.recipient != undefined){
                var recipient = rdbOO.get_operator_by_id(order.recipient);
                if(recipient){
                    recipientName = recipient.fullName;
                }
            }else{
                recipientName = OperatorHelper.get_on_duty_name(order.group);
            }


            response.push({
                serverNO: order.serverNO,
                classID: order.classID,
                id: order.id,
                state: order.state,
                level: order.level,
                fullName: order.fullName,
                recipient: order.recipient,
                recipientName: recipientName ? recipientName : '未知',
                startTime: order.startTime
            });
        }
        index++;
    };

    var order_arr = db.ramdb.order.get_all_order();
    if(order_arr && order_arr.length > 0){
        for(var i=order_arr.length-1;i>=0;i--){
            var order = order_arr[i];
            if(order.region && !mnoDic[order.region.serverNO]){
                continue;
            }

            if(order.recipient == undefined && order.group == user.group.id && isOnDuty){
                add_order(order);
                continue;
            }
            if(order.state == OrderState.draft){
                if(order.sponsor == user.id){
                    add_order(order);
                    continue;
                }
            }else{
                if(isAdmin || order.recipient == user.id){
                    add_order(order);
                    continue;
                }
            }
        }
    }

    callback(null, response);
}

module.exports.cmd = cmd.odr_0x00010010;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number'},
        classID: {type: 'number'},
        id: {type: 'number'}
    }
};
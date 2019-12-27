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

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var user  = req.user;
    var _user = db.ramdb.oo.get_by_identity(user);
    var isOnDuty = false;
    if(_user){
        isOnDuty = (_user.state == OperatorState.onDuty);
    }

    var pageIndex = body.pageIndex;
    var pageSize = body.pageSize;
    var types = undefined;
    if(body.types){
        types = {};
        for(var i in body.types){
            var type = body.types[i];
            types[type] = 1;
        }
    }

    var start = pageIndex * pageSize;
    var end = start + pageSize;

    var dbOrder = db.order;

    var isAdmin = (user.classID == uiclassID.admin || user.group.classID == uiclassID.adminGroup);

    var response = [];

    var index = 0;
    var add_order = function (order) {
        if(index >= start && index < end){
            response.push({
                serverNO: order.serverNO,
                classID: order.classID,
                id: order.id,
                step: order.step,
                state: order.state,
                fullName: order.fullName,
                level: order.level,
                sponsor: order.sponsor,
                recipient: order.recipient,
                sendTime: order.sendTime,
                startTime: order.startTime,
                // restData: order.restData
            });
        }
        index++;
    };

    var order_arr = db.ramdb.order.get_all_order();
    if(order_arr && order_arr.length > 0){
        for(var i=order_arr.length-1;i>=0;i--){
            var order = order_arr[i];

            //过滤条件
            if(types != undefined && !types[order.classID]){
                continue;
            }

            if(order.state == OrderState.draft){//草稿状态仅，创建人可见。
                if(order.sponsor == user.id){
                    add_order(order);
                    continue;
                }
            }else{
                if(order.recipient == undefined && order.group == user.group.id && isOnDuty){
                    add_order(order);
                    continue;
                }
                if(isAdmin || order.recipient == user.id){
                    add_order(order);
                    continue;
                }
            }
        }
    }

    callback(null, {total: index, pageIndex: pageIndex, pageSize: pageSize, list: response});
}

module.exports.cmd = cmd.odr_0x00010001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        pageIndex: {type: 'number', required: true},
        pageSize: {type: 'number', required: true},
        types: {
            type: 'array',
            items: {
                type: 'number'
            }
        }
    }
};
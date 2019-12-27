/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var PositionType = require('../../../definition/position_type');
var OrderState = require('../../../modules/order/definition/order_state');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var user = req.user;
    var _user = db.ramdb.oo.get_by_identity(user);

    var isManager = false;
    if(user.classID == uiclassID.admin || user.group.classID == uiclassID.adminGroup){
        isManager = true;
    }else if(_user){
        if(_user.position == PositionType.director || _user.position == PositionType.inspector){
            isManager = true;
        }
    }

    var pageIndex = body.pageIndex;
    var pageSize = body.pageSize;

    var start = pageIndex * pageSize;
    var end = start + pageSize;

    var dbOrder = db.order;

    var startTime = new Date(body.start);
    var endTime = new Date(body.end);
    var orderID = body.id;

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
                restData: order.restData
            });
        }
        index++;
    };

    var order_arr = db.ramdb.order.get_all_order();
    if(order_arr && order_arr.length > 0){
        for(var i=order_arr.length-1;i>=0;i--){
            var order = order_arr[i];

            //过滤条件
            if(order.classID != uiclassID.drillOrder){
                continue;
            }
            if(order.step <= 2){//未审核
                continue;
            }
            var planTime = order.restData.planTime;
            if(planTime && (planTime < startTime || planTime > endTime)){
                continue;
            }
            if(orderID != undefined && order.id != orderID){
                continue;
            }

            if(order.sponsor == user.id){//发起人为当前登陆人
                add_order(order);
                continue;
            }
            if(order.state != OrderState.draft){
                if(isManager){
                    add_order(order);
                    continue;
                }
                if(order.restData.participant != undefined && order.restData.participant.indexOf(user.id) >= 0){//参与人包含当前人
                    add_order(order);
                    continue;
                }
            }
        }
    }

    callback(null, {total: index, pageIndex: pageIndex, pageSize: pageSize, list: response});
}

module.exports.cmd = cmd.odr_0x00010007;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        pageIndex: {type: 'number', required: true},
        pageSize: {type: 'number', required: true},
        id: {type: 'number'},
        start: {
            type: 'string',
            pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}',
            required: true
        },
        end: {
            type: 'string',
            pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}',
            required: true
        }
    }
};
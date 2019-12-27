/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var OrderState = require('../../../modules/order/definition/order_state');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var user = req.user;

    var isManager = false;
    if(user.classID == uiclassID.admin || user.group.classID == uiclassID.adminGroup){
        isManager = true;
    }

    var dbOrder = db.order;

    var pageIndex = body.pageIndex;
    var pageSize = body.pageSize;

    var time = undefined;
    if(body.start){
        if(!time){
            time = {};
        }
        time['$gte'] = new Date(body.start);
    }
    if(body.end){
        if(!time){
            time = {};
        }
        time['$lt'] = new Date(body.end);
    }

    var query = {};
    if(time){
        query.startTime = time;
    }
    if(body.state != undefined){
        query.state = body.state;
    }
    if(!isManager){
        query.users = user.id;
        query.recipient = {$ne: user.id};
    }else if(query.state == undefined){
        query.state = {$ne: OrderState.draft};
    }
    if(body.types){
        query.classID = {$in: body.types}
    }
    if(body.id != undefined){
        query.id = body.id;
    }

    dbOrder.count(query, function (err, count) {
        if(err) return callback(err);

        dbOrder.find_order(query, {serverNO: 1, classID: 1, id: 1, step: 1, state: 1, fullName: 1, level: 1, sponsor: 1, startTime: 1, sendTime: 1, receiveTime: 1, endTime: 1}).sort({startTime: -1}).skip(pageIndex * pageSize).limit(pageSize).toArray(function (err, results) {
            if(err) return callback({status: code.unknown, msg: 'find order failed'});

            var result = [];
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    result.push({
                        serverNO: item.serverNO,
                        classID: item.classID,
                        id: item.id,
                        step: item.step,
                        state: item.state,
                        fullName: item.fullName,
                        level: item.level,
                        sponsor: item.sponsor,
                        startTime: item.startTime,
                        sendTime: item.sendTime,
                        receiveTime: item.receiveTime,
                        endTime: item.endTime
                    })
                }
            }

            callback(null, {total: count, pageIndex: pageIndex, pageSize: pageSize, list: result});
        });
    });
}

module.exports.cmd = cmd.odr_0x00010004;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        pageIndex: {type: 'number'},
        pageSize: {type: 'number'},
        types: {
            type: 'array',
            items: {type: 'number'}
        },
        id: {type: 'number'},
        state: {type: 'number'},
        start: {
            type: 'string',
            pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'
        },
        end: {
            type: 'string',
            pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'
        }
    }
};
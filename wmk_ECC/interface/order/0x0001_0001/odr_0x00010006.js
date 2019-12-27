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
    
    var aNO = body.aNO;

    var query = {classID: uiclassID.assetOrder, state: OrderState.finished};
    if(time){
        query['restData.planTime'] = time;
    }
    if(!isManager){
        query['$or'] = [{sponsor: user.id}, {'restData.maintain': user.id}]//发起人或维护人是当前登陆人
    }
    if(aNO){
        query['restData.asset.aNO'] = aNO;
    }

    dbOrder.count(query, function (err, count) {
        if(err) return callback(err);

        dbOrder.find_order(query, {serverNO: 1, classID: 1, id: 1, step: 1, state: 1, fullName: 1, level: 1, sponsor: 1, startTime: 1, restData: 1}).sort({startTime: -1}).skip(pageIndex * pageSize).limit(pageSize).toArray(function (err, results) {
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
                        restData: item.restData
                    })
                }
            }

            callback(null, {total: count, pageIndex: pageIndex, pageSize: pageSize, list: result});
        });
    });
}

module.exports.cmd = cmd.odr_0x00010006;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        pageIndex: {type: 'number'},
        pageSize: {type: 'number'},
        types: {
            type: 'array',
            items: {
                type: 'number'
            }
        },
        aNO: {type: 'string'},
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
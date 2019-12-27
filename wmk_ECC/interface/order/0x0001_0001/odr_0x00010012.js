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
    var dbOrder = db.order;

    var device = db.ramdb.no.get_by_identity(body);
    if(!device){
        callback({status: code.not_found, msg: 'device not found'});
        return;
    }

    var response = [];

    if(!device.aNO){
        callback(null, response);
        return;
    }

    var query = {state: {$ne: OrderState.draft}};

    query.classID = uiclassID.assetOrder;
    query['restData.asset.aNO'] = device.aNO;

    query.startTime = {$gte: new Date(body.startTime), $lt: new Date(body.endTime)};

    dbOrder.find_order(query, {_id: 0, serverNO: 1, classID: 1, id: 1, fullName: 1, level: 1, state: 1, startTime: 1, 'restData.planTime': 1, 'restData.maintain': 1, 'restData.type': 1}, function (err, results) {
        if(err) return callback({status: code.unknown, msg: 'find order failed'});

        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];

                response.push({
                    serverNO: item.serverNO,
                    classID: item.classID,
                    id: item.id,
                    state: item.state,
                    level: item.level,
                    fullName: item.fullName,
                    startTime: item.startTime,
                    restData: item.restData
                })
            }
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.odr_0x00010012;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        startTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true},
        endTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true}
    }
};
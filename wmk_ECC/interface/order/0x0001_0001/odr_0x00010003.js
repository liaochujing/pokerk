/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbOrder = db.order;

    var query = {$or: body.identities};
    dbOrder.find_order(query, {restData: 0, operationList: 0}, function (err, results) {
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
                    // name: item.name,
                    fullName: item.fullName,
                    level: item.level,
                    sponsor: item.sponsor,
                    recipient: item.recipient,
                    sendTime: item.sendTime
                })
            }
        }

        callback(null, result);
    });
}

module.exports.cmd = cmd.odr_0x00010003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        identities: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true}
                }
            },
            required: true
        }
    }
};
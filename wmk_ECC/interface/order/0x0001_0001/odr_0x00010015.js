/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var OrderState = require('../../../modules/order/definition/order_state');

var db = require('../../../db/index');
var dbOrder = db.order;

function handle(req, res, body, callback) {
    dbOrder.count({state: {$in: [OrderState.unreceived, OrderState.processing]}, 'region.serverNO': body.serverNO, 'region.classID': body.classID, 'region.id': body.id}, function (err, result) {
        if(err) return callback(err);
        callback(null, {count: result});
    });
}

module.exports.cmd = cmd.odr_0x00010015;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'integer', required: true},
        classID: {type: 'integer', required: true},
        id: {type: 'integer', required: true}
    }
};
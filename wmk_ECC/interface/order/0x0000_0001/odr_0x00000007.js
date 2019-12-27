/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var dbOrder = db.order;

function handle(req, res, body, callback) {
    var user = req.user;
    var order = ramdb.order.get_order_sync(body.serverNO, body.classID, body.id);
    if(order){
        dbOrder.remove_attachment(order.serverNO, order.classID, order.id, body.attachmentID, function (err) {
            if(err) return callback({status: code.unknown, msg: 'remove failed'});
            callback();
        })
    }else{
        callback({status: code.not_found, msg: 'order not found'});
    }
}

module.exports.cmd = cmd.odr_0x00000007;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        attachmentID: {type: 'number', required: true}
    }
};
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
var ramdb = db.ramdb;
var dbOrder = db.order;

function handle(req, res, body, callback) {
    var user = req.user;
    var order = ramdb.order.get_order_sync(body.serverNO, body.classID, body.id);
    if(order){
        dbOrder.save_temp_data(order.serverNO, order.classID, order.id, body.tempData, function (err) {
            if(err) return callback({status: code.unknown, msg: 'update order failed'});
            callback();
        })
    }else{
        callback({status: code.not_found, msg: 'order not found'});
    }
}

module.exports.cmd = cmd.odr_0x00000030;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number'},
        classID: {type: 'number'},
        id: {type: 'number'},
        tempData: {type: 'object', required: true}
    }
};
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var deviceHelper = require('../../../helpers/device_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var user = req.user;
    var dbOrder = db.order;

    var query = {serverNO: body.serverNO, classID: body.classID, id: body.id/*, $or: [{sponsor: user.id}, {recipient: user.id}, {group: user.group.id}]*/};
    dbOrder.findOne(query, function (err, order) {
        if(err) return callback({status: code.unknown, msg: 'find order failed'});

        if(order){
            if(order.classID == uiclassID.alarmOrder){
                var alarm = order.restData.alarm;
                var source = order.restData.source;
                if(source){
                    source.path = deviceHelper.get_device_path(source);
                }
            }
        }

        callback(null, order);
    });
}

module.exports.cmd = cmd.odr_0x00010002;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
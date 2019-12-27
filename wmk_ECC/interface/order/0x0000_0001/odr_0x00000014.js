/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var util = require('util');
var fs = require('fs');

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var dbOrder = db.order;
var dbAttachment = db.attachment;
var dbObjID = db.objID;

function handle(req, res, body, callback) {
    var user = req.user;
    var order = ramdb.order.get_order_sync(body.serverNO, body.classID, body.id);
    if(order){
        dbObjID.gen_object_id('attachment', function (err, id) {
            if(err) return callback(err);
            dbAttachment.insert_attachment(id, body.filename, body.data, function (err) {
                if(err) return callback(err);

                var attachmentList = [];
                attachmentList.push({id: id, name: body.filename, tag: body.tag});

                dbOrder.add_attachment(order.serverNO, order.classID, order.id, attachmentList, function (err) {
                    if(err) return callback({status: code.unknown});
                    callback(null, {id: id});
                });
            });
        });
    }else{
        callback({status: code.not_found, msg: 'order not found'});
    }
}

module.exports.cmd = cmd.odr_0x00000014;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        filename: {type: 'string', required: true},
        tag: {type: 'object'},
        data: {type: 'string', required: true}
    }
};
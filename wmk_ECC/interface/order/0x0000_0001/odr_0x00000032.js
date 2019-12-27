/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbOBJID = db.objID;
var dbOT = db.order_template;

function handle(req, res, body, callback) {
    dbOBJID.gen_object_id('order_template', function (err, id) {
        if(err) return callback(err);
        dbOT.insert_order_template(id, body.name, body.desc, body.data, function (err) {
            if(err) return callback(err);
            callback(null, {id: id});
        })
    });
}

module.exports.cmd = cmd.odr_0x00000032;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        name: {type: 'string', required: true},
        desc: {type: 'string', required: true},
        data: {type: 'object', required: true}
    },
    required: true
};
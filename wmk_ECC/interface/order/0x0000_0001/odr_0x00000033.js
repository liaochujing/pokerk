/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbOT = db.order_template;

function handle(req, res, body, callback) {
    dbOT.update_order_template(body.id, body.name, body.desc, body.data, function (err) {
        if(err) return callback(err);
        callback()
    })
}

module.exports.cmd = cmd.odr_0x00000033;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'integer', required: true},
        name: {type: 'string', required: true},
        desc: {type: 'string', required: true},
        data: {type: 'object', required: true}
    },
    required: true
};
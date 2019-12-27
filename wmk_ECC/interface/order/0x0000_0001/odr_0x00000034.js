/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbOT = db.order_template;

function handle(req, res, body, callback) {
    dbOT.remove_order_template(body.id, function (err) {
        if(err) return callback(err);
        callback()
    })
}

module.exports.cmd = cmd.odr_0x00000034;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'integer', required: true}
    },
    required: true
};
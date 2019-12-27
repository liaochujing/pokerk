/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbOT = db.order_template;

function handle(req, res, body, callback) {
    dbOT.find_order_template({id: body.id}, {_id: 0}, function (err, results) {
        if(err) return callback(err);
        var template = undefined;
        if(results && results.length == 1){
            template = results[0]
        }
        callback(null, template);
    })
}

module.exports.cmd = cmd.odr_0x00000035;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'integer', required: true}
    },
    required: true
};
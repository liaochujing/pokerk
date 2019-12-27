/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    if(body.length == 0){
        callback();
        return;
    }
    var dbNO = db.no;
    dbNO.find_nameobject_config({$or: body}, {_id: 0}, function (err, results) {
        if(err) return callback(err);
        callback(null, results);
    });
}

module.exports.cmd = cmd.cfg_0x00000010;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            serverNO: {type: 'number', required: true},
            classID: {type: 'number', required: true},
            id: {type: 'number', required: true},
            key: {type: 'string', required: true}
        }
    }
};
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbNO = db.no;
    dbNO.update_nameobject_config(body.serverNO, body.classID, body.id, body.key, body.value, function (err) {
        if(err) return callback(err);
        callback();
    });
}

module.exports.cmd = cmd.mgr_0x00010010;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        key: {type: 'string', required: true},
        value: {type: 'object', required: true}
    }
};
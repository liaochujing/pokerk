/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbCDP = db.cdp;

function handle(req, res, body, callback) {
    dbCDP.find_collect_device_point({serverNO: body.serverNO, classID: body.classID, id: body.id}, {_id: 0, serverNO: 0, classID: 0, id: 0, time: 0}, function (err, results) {
        if(err) return callback(err);
        callback(null, results);
    })
}

module.exports.cmd = cmd.mgr_0x00020011;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
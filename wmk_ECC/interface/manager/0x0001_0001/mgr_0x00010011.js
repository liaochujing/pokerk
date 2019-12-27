/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbNO = db.no;
    dbNO.find_nameobject_config({serverNO: body.serverNO, classID: body.classID, id: body.id, key: body.key}, {_id: 0, value: 1}, function (err, results) {
        if(err) return callback(err);

        var res = undefined;
        if(results && results.length > 0){
            res = results[0].value;
        }

        callback(null, res);
    });
}

module.exports.cmd = cmd.mgr_0x00010011;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        key: {type: 'string', required: true}
    }
};
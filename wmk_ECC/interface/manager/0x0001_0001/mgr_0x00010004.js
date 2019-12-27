/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var privilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var _object = db.ramdb.no.get_no_sync(body.serverNO, body.classID, body.id);
    if(_object){
        var dbNO = db.no;
        dbNO.find_nameobject({serverNO: _object.serverNO, classID: _object.classID, id: _object.id}, {_id: 0}, function (err, result) {
            if (err) return callback(err);

            var row = undefined;
            if(result && result.length > 0){
                row = result[0];
            }

            callback(null, row);
        });
    }else{
        callback({status: code.not_found, msg: 'object not found'});
    }
}

module.exports.cmd = cmd.mgr_0x00010004;
module.exports.privilege = privilegePoint.queryObject;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {
            type: 'number',
            required: true
        },
        classID: {
            type: 'number',
            required: true
        },
        id: {
            type: 'number',
            required: true
        }
    }
};
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var privilegePoint = require('../../../definition/privilege_point');
var objectHelper = require('../../../objects/object_helper');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var _object = db.ramdb.cno.get_by_identity(body);
    if(_object){
        var dbCNO = db.cno;
        dbCNO.find_collect_object({serverNO: _object.serverNO, classID: _object.classID, id: _object.id}, {_id: 0}, function (err, result) {
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

module.exports.privilege = privilegePoint.queryCollectDevice;
module.exports.cmd = cmd.mgr_0x00020004;
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
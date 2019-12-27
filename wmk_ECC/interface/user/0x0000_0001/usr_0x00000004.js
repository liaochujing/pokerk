/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var privilegePoint = require('../../../definition/privilege_point');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var objectHelper = require('../../../objects/object_helper');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var _object = db.ramdb.oo.get_group_by_id(body.id);
    if(_object){
        var dbOO = db.oo;
        dbOO.find_operator_object({serverNO: _object.serverNO, classID: _object.classID, id: _object.id}, {_id: 0}, function (err, result) {
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

module.exports.privilege = privilegePoint.queryOperatorGroup;
module.exports.cmd = cmd.usr_0x00000004;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {
            type: 'number',
            // required: true
        },
        classID: {
            type: 'number',
            // required: true
        },
        id: {
            type: 'number',
            required: true
        }
    }
};
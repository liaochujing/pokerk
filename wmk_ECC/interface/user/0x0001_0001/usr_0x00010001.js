/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var OperatorState = require('../../../definition/operator_state');
var WST_STATE = require('../../../modules/user/definition/work_sheet_state');
var WST_OPERATION = require('../../../modules/user/definition/work_sheet_operation');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var objID = db.objID;
    var wst = db.wst;

    var user = req.user;
    var _user = db.ramdb.oo.get_by_identity(user);
    if(!_user){
        callback({status: code.not_found, msg: 'user not found'});
        return;
    }
    if(_user.state != OperatorState.onDuty){
        callback({status: code.unknown, msg: '未值班，不可新增事项!'});
        return;
    }

    var title = body.title;
    var content = body.content;
    var description = body.description;
    var state = WST_STATE.normal;
    var time = new Date();

    objID.gen_object_id('work_sheet', function (err, sheetID) {
        if(err) return callback({status: code.unknown});
        wst.insert_work_sheet(user.group.serverNO, user.group.classID, user.group.id, sheetID, title, content, description, {type: WST_OPERATION.create, user: user.id, time: time}, state, time, function (err) {
            if(err) return callback({status: code.unknown});
            callback(null, {sheetID: sheetID, state: state, time: time})
        })
    });
}

module.exports.cmd = cmd.usr_0x00010001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        title: {type: 'string', required: true},
        content: {type: 'string', required: true},
        description: {type: 'string'}
    }
};
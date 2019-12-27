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
    var wst = db.wst;

    var user = req.user;
    var _user = db.ramdb.oo.get_by_identity(user);
    if(!_user){
        callback({status: code.not_found, msg: 'user not found'});
        return;
    }
    if(_user.state != OperatorState.onDuty){
        callback({status: code.unknown, msg: '未值班，不可修改事项!'});
        return;
    }

    var sheetID = body.sheetID;
    var title = body.title;
    var content = body.content;
    var description = body.description;
    var state = WST_STATE.normal;
    var time = new Date();

    wst.find_work_sheet({sheetID: sheetID}, {serverNO: 1, classID: 1, id: 1, content: 1, state: 1}, function (err, data) {
        if(err) return callback({status: code.unknown});
        if(data && data.length > 0){
            var sheet = data[0];
            if(sheet.serverNO == user.group.serverNO && sheet.id != user.group.id){
                callback({status: code.has_no_privilege});
                return;
            }
            if(sheet.state == WST_STATE.normal){
                var operation = {type: WST_OPERATION.modify, user: user.id, content: data.content, time: time};
                wst.update_work_sheet(sheetID, title, content, description, {type: WST_OPERATION.create, user: user.id}, function (err) {
                    if(err) return callback({status: code.unknown});
                    callback(null, {sheetID: sheetID, time: time})
                })
            }else{
                callback({status: code.unknown, msg: 'work sheet is finished'});
            }
        }else{
            callback({status: code.not_found, msg: 'work sheet not found'});
        }
    });
}

module.exports.cmd = cmd.usr_0x00010002;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        sheetID: {type: 'number', required: true},
        title: {type: 'string', required: true},
        content: {type: 'string', required: true},
        description: {type: 'string'}
    }
};
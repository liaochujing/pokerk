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
    var dbWST = db.wst;

    var user = req.user;
    var _user = db.ramdb.oo.get_by_identity(user);
    if(!_user){
        callback({status: code.not_found, msg: 'user not found'});
        return;
    }
    if(_user.state != OperatorState.onDuty){
        callback({status: code.unknown, msg: '未值班，不可完成事项!'});
        return;
    }

    var sheetID = body.sheetID;
    var state = WST_STATE.finished;
    var time = new Date();
    var operation = {type: WST_OPERATION.finish, user: user.id, time: time};
    dbWST.find_work_sheet({sheetID: sheetID}, {serverNO: 1, classID: 1, id: 1, state: 1}, function (err, data) {
        if(err) return callback(err);
        var wst = undefined;
        if(data && data.length > 0){
            wst = data[0];
        }
        if(wst){
            if(wst.serverNO == user.group.serverNO && wst.id != user.group.id){
                callback({status: code.has_no_privilege});
                return;
            }
            if(wst.state == WST_STATE.normal){
                dbWST.finish_work_sheet(sheetID, state, operation, time, function (err) {
                    if(err) return callback({status: code.unknown});
                    callback(null, {sheetID: sheetID, state: state, time: time})
                });
            }else{
                callback({status: code.unknown, msg: 'work sheet state error'});
            }
        }else{
            callback({status: code.not_found})
        }
    });
}

module.exports.cmd = cmd.usr_0x00010003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        sheetID: {type: 'number', required: true}
    }
};
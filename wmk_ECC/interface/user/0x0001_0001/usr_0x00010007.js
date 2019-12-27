/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var OperatorState = require('../../../definition/operator_state');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbWLG = db.wlg;

    var user = req.user;
    var _user = db.ramdb.oo.get_by_identity(user);
    if(!_user){
        callback({status: code.not_found, msg: 'user not found'});
        return;
    }
    if(_user.state != OperatorState.onDuty){
        callback({status: code.unknown, msg: '未值班，不可修改工作日志!'});
        return;
    }

    var logID = body.logID;
    var content = body.content;
    var time = new Date();

    dbWLG.find_work_log({logID: logID}, {serverNO: 1, classID: 1, id: 1}, function (err, data) {
        if(err) return callback({status: code.unknown});
        var wlg = undefined;
        if(data && data.length > 0){
            wlg = data[0];
        }
        if(wlg){
            if(wlg.serverNO == user.serverNO && wlg.id != user.id){
                callback({status: code.has_no_privilege});
                return;
            }
            dbWLG.update_work_log(logID, content, time, function (err) {
                if(err) return callback({status: code.unknown});
                callback(null, {logID: logID, time: time})
            })
        }else{
            callback({status: code.not_found, msg: 'work log not found'});
        }
    });
}

module.exports.cmd = cmd.usr_0x00010007;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        logID: {type: 'number', required: true},
        content: {type: 'string', required: true}
    }
};
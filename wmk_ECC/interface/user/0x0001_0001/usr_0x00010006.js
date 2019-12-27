/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var OperatorState = require('../../../definition/operator_state');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var objID = db.objID;
    var dbWLG = db.wlg;

    var user = req.user;
    var _user = db.ramdb.oo.get_by_identity(user);
    if(!_user){
        callback({status: code.not_found, msg: 'user not found'});
        return;
    }
    if(_user.state != OperatorState.onDuty){
        callback({status: code.unknown, msg: '未值班，不可新增工作日志!'});
        return;
    }

    var content = body.content;
    var time = new Date();

    objID.gen_object_id('work_log', function (err, logID) {
        if(err) return callback({status: code.unknown});
        dbWLG.insert_work_log(user.serverNO, user.classID, user.id, logID, content, time, function (err) {
            if(err) return callback({status: code.unknown});
            callback(null, {logID: logID, time: time})
        })
    });
}

module.exports.cmd = cmd.usr_0x00010006;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        content: {type: 'string', required: true}
    }
};
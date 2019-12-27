/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

var db = require('../../../db/index');
var rdbOO = db.ramdb.oo;

function handle(req, res, body, callback) {
    var user = req.user;
    var admin = rdbOO.get_operator_by_account('admin');
    if(!admin){
        callback({status: code.other, msg: 'admin账号未找到'});
        return;
    }

    if(admin.serverNO != user.serverNO || admin.classID != user.classID || admin.id != user.id){
        //非管理员，无权限修改此密码
        callback({status: code.has_no_privilege});
        return
    }
    if(admin.password != body.old_password){
        callback({status: code.other, msg: '密码错误'});
        return;
    }

    var now = new Date();
    var dbOO = db.oo;

    var setpro = {};

    setpro['restData.password'] = body.new_password;
    setpro.modifyTime = now;

    dbOO.update({serverNO: admin.serverNO, classID: admin.classID, id: admin.id}, {$set: setpro}, function (err) {
        if(err) {
            callback({status: code.unknown, err: err});
            return;
        }

        dbOO.find_operator_object({serverNO: admin.serverNO, classID: admin.classID, id: admin.id}, {_id: 0}, function (err, results) {
            if(err) {
                logger.error({msg: 'try notify operator object changed failed', obj: admin, err: err});
                return;
            }

            if(results && results.length > 0){
                var row = results[0];

                rdbOO.del_oo(admin);
                admin.load_from_json(row);
                rdbOO.set_oo(admin);

                notifyHelper.send_notify(new NotifyMsg(NotifyType.operator_object_modified, {object: row}));
            }
        });

        callback();
    });
}

module.exports.cmd = cmd.usr_0x00000011;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        old_password: {type: 'string', required: true},
        new_password: {type: 'string', required: true}
    }
};
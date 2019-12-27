/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var privilegePoint = require('../../../definition/privilege_point');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var dbRTP = db.rtp;
    dbRTP.update_report_template(body.id, body.name, body.desc, body.config, function (err) {
        if(err) return callback(err);

        dbOPL.insert_user_log(ManagerAction.modify_report_template, req.user, '修改报表模板:' + body.name, {id: body.id, type: body.type, cmd: body.cmd, name: body.name, desc: body.desc, config: body.config}, new Date());

        callback();
    });
}

module.exports.privilege = privilegePoint.modifyReportTemplate;
module.exports.cmd = cmd.mgr_0x0001000B;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true},
        type: {type: 'number', required: true},
        name: {type: 'string', required: true},
        desc: {type: 'string'},
        config: {type: 'object', required: true}
    }
};
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
    var objID = db.objID;

    objID.gen_object_id('report_template', function (err, id) {
        if(err) return callback(err);

        dbRTP.insert_report_template(id, body.type, body.cmd, body.name, body.desc, body.config,body.areaID, function (err) {
            if(err) return callback(err);

            dbOPL.insert_user_log(ManagerAction.add_report_template, req.user, '创建报表模板:' + body.name, {id: id, type: body.type, cmd: body.cmd, name: body.name, desc: body.desc, config: body.config}, new Date());

            callback(null, {id: id});
        });
    });
}

module.exports.privilege = privilegePoint.addReportTemplate;
module.exports.cmd = cmd.mgr_0x0001000A;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        areaID:{type:'string',required: true},
        type: {type: 'number', required: true},
        cmd: {type: 'string', required: true},
        name: {type: 'string', required: true},
        desc: {type: 'string'},
        config: {type: 'object', required: true}
    }
};
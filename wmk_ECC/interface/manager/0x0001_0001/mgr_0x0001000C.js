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
    dbRTP.find_report_template({id: body.id}, {_id: 0}, function (err, results) {
        if(err) return callback(err);
        if(results && results.length > 0){
            var _template = results[0];
            dbRTP.remove_report_template(body.id, function (err) {
                if(err) return callback(err);

                dbOPL.insert_user_log(ManagerAction.remove_report_template, req.user, '删除报表模板:' + _template.name, _template, new Date());

                callback();
            });
        }else{
            callback();
        }
    });
}

module.exports.privilege = privilegePoint.modifyReportTemplate;
module.exports.cmd = cmd.mgr_0x0001000C;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true}
    }
};
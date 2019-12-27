/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var PrivilegePoint = require('../../../definition/privilege_point');
// var svrType = require('../../../definition/service_type');
// var AlarmAction = require('../../../modules/alarm/definition/alarm_action');
// var OperatorAction = require('../../../modules/user/definition/operator_action');
var db = require('../../../db/index');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var ramdb = db.ramdb;

    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    dbOPL.find_user_log({time: {$gte: startTime, $lt: endTime}}, {_id: 0}, function (err, results) {
        if(err) logger.error(err);

        // var response = [];
        // if(results){
        //     for(var i=0;i<results.length;i++){
        //         var row = results[i];
        //
        //         var userName = undefined;
        //         var user = ramdb.oo.get_operator_by_id(row.id);
        //         if(user){
        //             userName = user.fullName;
        //         }
        //         var device = undefined;
        //         var point = undefined;
        //         var desc = undefined;
        //
        //         switch(row.module){
        //             case svrType.alarm:
        //                 switch(row.action){
        //                     case AlarmAction.hangup_point:
        //                         if(row.data){
        //                             if(row.data.hangup){
        //                                 if(row.data.hangup.enabled == 1){
        //                                     desc = '挂起告警';
        //                                 }else{
        //                                     desc = '解挂告警';
        //                                 }
        //                             }
        //                             var _device = ramdb.no.get_by_identity(row.data);
        //                             if(_device){
        //                                 device = _device.fullName;
        //                             }
        //                             var _point = ramdb.dep.get_device_type_point(device.template, row.data.pointIndex);
        //                             if(_point){
        //                                 point = _point.name;
        //                             }
        //                         }
        //                         break;
        //                     case AlarmAction.shield_point:
        //                         if(row.data){
        //                             if(row.data.shield){
        //                                 if(row.data.shield.shield == 1){
        //                                     desc = '屏蔽告警';
        //                                 }else{
        //                                     desc = '屏蔽告警';
        //                                 }
        //                             }
        //                             var _device = ramdb.no.get_by_identity(row.data);
        //                             if(_device){
        //                                 device = _device.fullName;
        //                             }
        //                             var _point = ramdb.dep.get_device_type_point(device.template, row.data.pointIndex);
        //                             if(_point){
        //                                 point = _point.name;
        //                             }
        //                         }
        //                         break;
        //                     case AlarmAction.alarm_type_changed:
        //                         if(row.data){
        //                             desc = '修改告警：' + row.data.name;
        //                         }
        //                         break;
        //                     case AlarmAction.alarm_type_deleted:
        //                         if(row.data){
        //                             desc = '删除告警：' + row.data.name;
        //                         }
        //                         break;
        //                     case AlarmAction.alarm_convergence:
        //                         if(row.data){
        //                             desc = '配置告警收敛';
        //                             var _device = ramdb.no.get_by_identity(row.data);
        //                             if(_device){
        //                                 device = _device.fullName;
        //                             }
        //                             var _point = ramdb.dep.get_device_type_point(device.template, row.data.pointIndex);
        //                             if(_point){
        //                                 point = _point.name;
        //                             }
        //                         }
        //                         break;
        //                     case AlarmAction.shield_device:
        //                         if(row.data){
        //                             if(row.data.shield){
        //                                 if(row.data.shield.shield == 1){
        //                                     desc = '屏蔽设备';
        //                                 }else{
        //                                     desc = '取消屏蔽设备';
        //                                 }
        //                             }
        //                             var _device = ramdb.no.get_by_identity(row.data);
        //                             if(_device){
        //                                 device = _device.fullName;
        //                             }
        //                         }
        //                         break;
        //                 }
        //                 break;
        //             case svrType.user:
        //                 switch(row.action){
        //                     case OperatorAction.login:
        //                         desc = '登录';
        //                         break;
        //                     case OperatorAction.logout:
        //                         desc = '登出';
        //                         break;
        //                     case OperatorAction.onDuty:
        //                         desc = '值班';
        //                         break;
        //                     case OperatorAction.offDuty:
        //                         desc = '交班';
        //                         break;
        //                 }
        //                 break;
        //         }
        //
        //         response.push({
        //             userName: userName,
        //             device: device,
        //             point: point,
        //             desc: desc,
        //             time: row.time
        //         })
        //     }
        // }
        // callback(null, response);

        callback(null, results);
    })
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010033;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};
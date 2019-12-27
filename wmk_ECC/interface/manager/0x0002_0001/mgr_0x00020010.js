/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbCNO = db.cno;
var dbCDP = db.cdp;
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var time = new Date();
    dbCNO.update_collect_bject_time(body.serverNO, body.classID, body.id, time, function (err) {
        if(err) return callback(err);
        dbCDP.clear_collect_device_point(body.serverNO, body.classID, body.id, function (err) {
            if(err) return callback(err);

            dbCDP.insert_collect_device_point(body.serverNO, body.classID, body.id, body.points, time, function (err) {
                if(err) return callback(err);

                notifyHelper.send_notify(new NotifyMsg(NotifyType.collect_device_point_changed, {serverNO: body.serverNO, classID: body.classID, id: body.id, points: body.points, time: time}));
                var device = db.ramdb.cno.get_by_identity({serverNO: body.serverNO, classID: body.classID, id: body.id});
                if(device){
                    dbOPL.insert_user_log(ManagerAction.set_collect_device_point, req.user, '采集设备:' + device.fullName + ' 点配置', null, new Date());
                }

                callback();
            })
        })
    });
}

module.exports.cmd = cmd.mgr_0x00020010;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        points: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    pointIndex: {type: 'number', required: true},
                    name: {type: 'string', required: true},
                    pointType: {type: 'number'},
                    unit: {type: 'string'},
                    desc: {type: 'string'},
                    config: {type: 'object'},
                    option: {type: 'object'}
                }
            },
            required: true
        }
    }
};
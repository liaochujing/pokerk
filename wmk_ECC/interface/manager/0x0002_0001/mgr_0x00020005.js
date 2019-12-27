/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var privilegePoint = require('../../../definition/privilege_point');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var dbCDT = db.cdt;

    body.time = new Date();
    dbCDT.insert_collect_device_type(body.id, body.name, body.desc, body.pointList, body.data, body.config, body.time, function (err) {
        if(err) return callback(err);

        var _type = {
            id: body.id,
            name: body.name,
            desc: body.desc,
            pointList: body.pointList,
            config: body.config,
            data: body.data,
            time: body.time
        };
        db.ramdb.cdt.set_type(_type);
        notifyHelper.send_notify(new NotifyMsg(NotifyType.collect_device_type_changed, _type));
        dbOPL.insert_user_log(ManagerAction.add_collect_device_type, req.user, '创建采集设备模板:' + body.name, null, new Date());
        
        callback();
    });
}

module.exports.privilege = privilegePoint.addCollectDeviceType;
module.exports.cmd = cmd.mgr_0x00020005;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true},
        name: {type: 'string', required: true},
        desc: {type: 'string', required: true},
        pointList: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: {type: 'string', required: true},
                    desc: {type: 'string'},
                    unit: {type: 'string'},
                    pointType: {type: 'number', required: true},
                    pointIndex: {type: 'number', required: true},
                    option: {type: 'object'},
                    config: {type: 'object'}
                }
            },
            required: true
        },
        config: {type: 'object'},
        data: {type: 'string', required: true}
    }
};
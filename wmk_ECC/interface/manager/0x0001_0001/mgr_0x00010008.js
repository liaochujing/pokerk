/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var privilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbDEP = db.dep;
    dbDEP.find_device_type(body, {}, function (err, result) {
        if(err) return callback(err);
        var res = undefined;

        if(result && result.length > 0){
            res = result[0];

            if(res.pointList && res.pointList.length > 0){
                for(let i=0;i<res.pointList.length;i++){
                    let item = res.pointList[i];
                    if(item.config && item.config.alarm) {
                        //旧告警数据不是数组则变成数组
                        if(item.config.alarm != null && !Array.isArray(item.config.alarm)){
                            let temp_alarm = [];
                            temp_alarm.push(item.config.alarm);
                            item.config.alarm = temp_alarm;
                        }
                    }
                }
            }
        }

        callback(null, res);
    });
}

module.exports.privilege = privilegePoint.queryDeviceType;
module.exports.cmd = cmd.mgr_0x00010008;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        system: {
            type: 'number',
            required: true
        },
        group: {
            type: 'number',
            required: true
        },
        id: {
            type: 'number',
            required: true
        }
    }
};
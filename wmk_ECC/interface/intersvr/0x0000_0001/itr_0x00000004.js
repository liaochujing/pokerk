/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var identity = body;
    var dbDP = db.dp;
    dbDP.find_point_by_device(identity, {_id: 0, pointIndex: 1, pointType: 1, fullName: 1, unit: 1, description: 1, 'config.alarm': 1}, function (err, dps) {
        if(err) return callback({status: code.unknown});

        var result = [];
        for(var i=0;i<dps.length;i++){
            var item = dps[i];

            var _i = {
                index: item.pointIndex,
                type: item.pointType,
                name: item.fullName,
                unit: item.unit,
                desc: item.description,
                // config: item.config
            };
            if(item.config && item.config.alarm){
                //旧告警数据不是数组则变成数组
                if(!Array.isArray(item.config.alarm)){
                    let temp_alarm = [];
                    temp_alarm.push(item.config.alarm);
                    _i.config = temp_alarm;
                }else{
                    _i.config = item.config.alarm;
                }
            }

            result.push(_i);
        }

        callback(null, result);
    });
}

module.exports.cmd = cmd.itr_0x00000004;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
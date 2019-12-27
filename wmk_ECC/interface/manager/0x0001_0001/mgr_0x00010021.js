/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var deviceHelper = require('../../../helpers/device_helper');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbDP = db.dp;
    var rdbNO = db.ramdb.no;
    var rdbDEP = db.ramdb.dep;

    dbDP.find_device_point({deviceServerNO: body.serverNO, deviceClassID: body.classID, deviceID: body.id}, {_id: 0, pointIndex: 1, pointType: 1, fullName: 1, unit: 1, description: 1, option: 1, config: 1, binding: 1}, function (err, results) {
        if(err) return callback(err);

        var points = results;
        var ref = [];

        var _dic = {};
        for(var i=0;i<points.length;i++){
            var _point = points[i];
            var _config = _point.config;
            if(_config.value && _config.value.expression && _config.value.expression.source){
                var _source = _config.value.expression.source;
                for(var j=0;j<_source.length;j++){
                    var _p = _source[j];

                    var serverNO = _p.serverNO || body.serverNO;
                    var classID = _p.classID || body.classID;
                    var id = _p.id || body.id;
                    var pointIndex = _p.pointIndex;

                    var _key = format_key(serverNO, id, pointIndex);
                    if(!_dic[_key]){
                        _dic[_key] = 1;

                        var name = '';
                        var device = rdbNO.get_no_sync(serverNO, classID, id);
                        if(device){
                            var _tp = rdbDEP.get_device_type_point(device.type, pointIndex);
                            if(_tp){
                                name = _tp.name;
                            }
                        }

                        ref.push({serverNO: serverNO, classID: classID, id: id, pointIndex: pointIndex, name: name});
                    }
                }
            }

            if(_config.alarm) {
                //旧告警数据不是数组则变成数组
                if(_config.alarm != null && !Array.isArray(_config.alarm)){
                    let temp_alarm = [];
                    temp_alarm.push(_config.alarm);
                    _config.alarm = temp_alarm;
                }
            }
        }

        callback(null, {points: points, ref: ref})
    });
}

module.exports.cmd = cmd.mgr_0x00010021;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');

var uiclassID = require('../../../definition/uiClassID');
var PointType = require('../../../definition/point_type');
var PrivilegePoint = require('../../../definition/privilege_point');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');

function handle(req, res, body, callback) {
    var dbDP = db.dp;

    var trans_point = function (done) {
        if(body.classID >= uiclassID.cObject && body.classID <= uiclassID.lastCObject){
            done(null, body);
        }else{
            dbDP.find_device_point({deviceServerNO: body.serverNO, deviceClassID: body.classID, deviceID: body.id, pointIndex: body.pointIndex}, {_id: 0, pointType: 1, binding: 1}, function (err, results) {
                if(err) return done(err);
                var point = undefined;
                var _point = undefined;
                if(results && results.length == 1){
                    point = results[0];
                    _point = point.binding;
                }
                if(!_point){
                    return done({status: code.other, msg: '未配置对应物理设备点'});
                }
                if(_point.serverNO == 0 || _point.classID == 0 || _point.id == 0 || _point.pointIndex == 0){
                    return done({status: code.other, msg: '未配置对应物理设备点'});
                }
                if(point.pointType != PointType.DO && point.pointType != PointType.AO){
                    return done({status: code.other, msg: '只能控制AO/DO点'});
                }

                done(null, _point);
            })
        }
    };

    trans_point(function (err, point) {
        if(err) return callback(err);
        var msg = new DataMessage(CentralCMD.cen_0x00010010, {serverNO: point.serverNO, classID: point.classID, id: point.id, pointIndex: point.pointIndex, pointValue: body.pointValue});
        dataHelper.send(msg, function (err, data) {
            if(err) return callback({status: code.other, msg: err.msg});
            if(data){
                if(data.code != code.ok){
                    callback({status: code.other, msg: data.msg})
                }else{
                    callback()
                }
            }else{
                callback({status: code.other, msg: '结果未知'})
            }
        })
    });
}

module.exports.privilege = PrivilegePoint.controlPoint;
module.exports.cmd = cmd.mgr_0x00010022;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        pointIndex: {type: 'number', required: true},
        pointValue: {type: 'number', required: true}
    }
};
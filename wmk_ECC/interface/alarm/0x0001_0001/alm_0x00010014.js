/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var privilegePoint = require('../../../definition/privilege_point');
var sysConfigKey = require('../../../modules/alarm/definition/system_config_key');
var db = require('../../../db');

function handle(req, res, body, callback) {

    var dbAAC = db.areaAlarmConfig;

    var serverNO = 0;
    var classID = 0;
    var id = 0;
    if (body && body.serverNO){
        serverNO = body.serverNO
    }
    if (body && body.classID){
        classID = body.serverNO
    }
    if (body && body.id){
        id = body.serverNO
    }

    dbAAC.find_area_alarm_config({serverNO: serverNO, classID: classID, id: id}, {},function (err, results) {
        if (err) return callback(err);
        var res = undefined;
        if (results && results.length > 0) {
            res = results[0]['schedule_alarm_config'];
        }
        callback(null, res);
    })
}

module.exports.privilege = privilegePoint.getAlarmNotify;
module.exports.cmd = cmd.alm_0x00010014;
module.exports.handle = handle;


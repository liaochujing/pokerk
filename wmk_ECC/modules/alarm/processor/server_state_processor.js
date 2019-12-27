/**
 * Created by wangxh on 2018/4/10.
 */

'use strict';

var ah = require('../../../util/array_helper');
var _logger = require('../../../util/log_manager');
var logger = _logger.logger;
var stateLog = _logger.stateLog;
var AlarmType = require('../../../definition/alarm_type');
var AlarmLevel = require('../../../definition/alarm_level');
var AlarmClass = require('../../../definition/alarm_class');
var ServerPoint = require('../../../definition/server_point');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');
var rdbAlarm = db.ramdb.alarm;

var Alarm = require('../../../objects/alarm/Alarm');
var alarmHelper = require('./alarm_helper');
var dataHelper = require('../../../protocol/central/server_manager');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');

function try_gen_offline_alarm(building) {
    if(alarmHelper.should_gen_alarm(building.serverNO, building.classID, building.id, ServerPoint.state, AlarmClass.server)){
        var now = new Date();

        var alarm = new Alarm();
        alarm.serverNO = defaultServerNO;
        alarm.classID = AlarmClass.server;

        alarm.type = AlarmType.fault;
        alarm.level = AlarmLevel.important;
        alarm.area = building.id;

        alarm.source = {serverNO: building.serverNO, classID: building.classID, id: building.id, pointIndex: ServerPoint.state};
        alarm.startTime = now;
        alarm.start = {pointValue: 0, pointValueTime: now};

        alarm.desc = '[' + building.fullName + '][通讯故障]';
        stateLog.error(alarm.desc);

        alarmHelper.try_gen_alarm(alarm, function (err) {
            if(err){
                logger.error({msg: 'try gen alarm failed', err: err});
            }
        })
    }
}

function try_end_offline_alarm(building) {
    var alarm = rdbAlarm.get_alarm_by_point(building.serverNO, building.classID, building.id, ServerPoint.state, AlarmClass.server);
    if(alarm){
        stateLog.info('[' + building.fullName + ']' + '[通讯恢复]');
        alarmHelper.try_end_alarm(alarm, {pointValue: 1, pointValueTime: new Date()}, function (err) {
            if(err){
                logger.error({msg: 'try end alarm failed', err: err});
            }
        })
    }
}

function start_monitor() {
    var max_err_times = 10;
    var _errDic = {};

    setInterval(function () {
        var buildings = db.ramdb.no.get_by_class(uiclassID.building);
        if(buildings && buildings.length > 0){
            var devices = [];
            for(var i=0;i<buildings.length;i++){
                var _building = buildings[i];
                devices.push({serverNO: _building.serverNO, classID: _building.classID, id: _building.id});
            }

            var msg = new DataMessage(CentralCMD.cen_0x00010003, {devices: devices});
            dataHelper.send(msg, function (err, results) {
                if(err){
                    logger.error('get building state failed, %j', err);
                    return;
                }

                if(results){
                    var dic = {};
                    for(var i=0;i<results.length;i++){
                        var item = results[i];
                        dic[format_key(item.serverNO, item.classID, item.id)] = item.online;
                    }

                    ah.each_series(buildings, function (building, cbItem) {
                        var _key = format_key(building.serverNO, building.classID, building.id);

                        var online = dic[_key];
                        if(online){
                            _errDic[_key] = 0;
                            try_end_offline_alarm(building);
                        }else{
                            if(!_errDic[_key]){
                                _errDic[_key] = 1;
                            }else if(_errDic[_key] < 10){
                                _errDic[_key]++;
                            }
                            var _errTimes = _errDic[_key];
                            if(_errTimes >= max_err_times){
                                try_gen_offline_alarm(building);
                            }
                        }
                        cbItem();
                    }, function () {

                    });
                }
            });
        }
    }, 3 * 1000);
}

function start_process() {

    setTimeout(function () {
        start_monitor();
    }, 10 * 1000);

}

module.exports.start_process = start_process;
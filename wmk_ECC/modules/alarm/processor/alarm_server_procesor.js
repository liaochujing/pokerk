/**
 * Created by wangxh on 2018/3/15.
 */

'use strict';

var os = require('os');
var st = require('../../../util/small_tools');
var _logger = require('../../../util/log_manager');
var logger = _logger.logger;
var stateLog = _logger.stateLog;

var uiclassID = require('../../../definition/uiClassID');
var AlarmLevel = require('../../../definition/alarm_level');
var AlarmClass = require('../../../definition/alarm_class');
var AlarmType = require('../../../definition/alarm_type');
var ServerPoint = require('../../../definition/server_point');
var Alarm = require('../../../objects/alarm/Alarm');

var db = require('../../../db');
var rdbAlarm = db.ramdb.alarm;

var alarmHelper = require('./alarm_helper');

const check_interval = 5 * 60 * 1000;//检查频率
const min_main_available_space = 1024 * 1024;//1G
const min_data_available_space = 100 * 1024 * 1024;//100G

function start_process() {
    function check() {
        var nos = db.ramdb.no.get_by_class(uiclassID.park);

        if(nos && nos.length > 0){
            var server = nos[0];

            var cmd = "df -k | grep -E '/$|/home$' | awk '{print $4,$6}'";
            st.executeShell(cmd, function (err, stdout) {
                if(err){
                    logger.error({msg: 'check server space failed', err: err});
                    return;
                }
                var available = parseInt(stdout);

                var main_available = 0;
                var data_available = 0;

                var lines = stdout.split('\n');
                for(var i=0;i<lines.length;i++){
                    var line = lines[i];
                    var cells = line.split(' ');
                    if(cells.length == 2){
                        var space = parseInt(cells[0]);
                        var path = cells[1];
                        if(path.indexOf('/home') >= 0){
                            data_available = space;
                        }else{
                            main_available = space;
                        }
                    }
                }

                if(main_available < min_main_available_space){
                    if(alarmHelper.should_gen_alarm(server.serverNO, server.classID, server.id, ServerPoint.main_disk, AlarmClass.server)){
                        var now = new Date();

                        var alarm = new Alarm();
                        alarm.serverNO = server.serverNO;
                        alarm.classID = AlarmClass.server;

                        alarm.type = AlarmType.fault;
                        alarm.area = server.id;

                        alarm.source = {serverNO: server.serverNO, classID: server.classID, id: server.id, pointIndex: ServerPoint.main_disk};
                        alarm.level = AlarmLevel.notice;
                        alarm.startTime = now;
                        alarm.start = {pointValue: main_available, pointValueTime: now};

                        alarm.desc = '[' + server.fullName + ']系统分区空间不足1G';
                        stateLog.error(alarm.desc + ',可用空间：', main_available);

                        alarmHelper.try_gen_alarm(alarm, function (err) {
                            if(err) logger.error({msg: 'try gen disk alarm failed', err: err});
                        })
                    }
                }else{
                    var alarm = rdbAlarm.get_alarm_by_point(server.serverNO, server.classID, server.id, ServerPoint.main_disk, AlarmClass.server);
                    if(alarm){
                        stateLog.info('[' + server.fullName + ']系统分区空间恢复,可用空间:%d', main_available);
                        alarmHelper.try_end_alarm(alarm, {pointValue: available, pointValueTime: new Date()}, function (err) {
                            if(err) logger.error({msg: 'try end disk alarm failed', err: err});
                        })
                    }
                }

                if(data_available < min_data_available_space){
                    if(alarmHelper.should_gen_alarm(server.serverNO, server.classID, server.id, ServerPoint.data_disk, AlarmClass.server)){
                        var now = new Date();

                        var alarm = new Alarm();
                        alarm.serverNO = server.serverNO;
                        alarm.classID = AlarmClass.server;

                        alarm.type = AlarmType.fault;
                        alarm.area = server.id;

                        alarm.source = {serverNO: server.serverNO, classID: server.classID, id: server.id, pointIndex: ServerPoint.data_disk};
                        alarm.level = AlarmLevel.notice;
                        alarm.startTime = now;
                        alarm.start = {pointValue: data_available, pointValueTime: now};

                        alarm.desc = '[' + server.fullName + ']数据分区空间不足100G';
                        stateLog.error(alarm.desc + ',可用空间：', main_available);

                        alarmHelper.try_gen_alarm(alarm, function (err) {
                            if(err) logger.error({msg: 'try gen disk alarm failed', err: err});
                        })
                    }
                }else{
                    var alarm = rdbAlarm.get_alarm_by_point(server.serverNO, server.classID, server.id, ServerPoint.data_disk, AlarmClass.server);
                    if(alarm){
                        stateLog.info('[' + server.fullName + ']数据分区空间恢复,可用空间：%d', data_available);
                        alarmHelper.try_end_alarm(alarm, {pointValue: available, pointValueTime: new Date()}, function (err) {
                            if(err) logger.error({msg: 'try end disk alarm failed', err: err});
                        })
                    }
                }
            })
        }
    }

    if(os.platform() != 'win32'){
        setInterval(function () {
            check();
        }, check_interval);

        check();
    }
}

module.exports.start_process = start_process;
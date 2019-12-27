/**
 * Created by wangxh on 2017/10/14.
 */

'use strict';

var guid = require('guid');
var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var alarm_class = require('../../../definition/alarm_class');
var alarm_level = require('../../../definition/alarm_level');
var Alarm = require('../../../objects/alarm/Alarm');
var db = require('../../../db');
var rdbAlarm = db.ramdb.alarm;
var dbAlarm = db.alarm;
var dbHisAlarm = db.datadb.hisalarm;

var Notification = require('../../../helpers/notification_helper');
var Emitter = Notification.Emitter;
var alarm_aom_processor = require('./alarm_aom_processor');
var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var objIDHelper = db.objID;

var alarm_gen_map = {};
var alarm_end_map = {};

function gen_alarm(alarm, callback) {
    objIDHelper.gen_object_id('alarm', function (err, id) {
        if(err) return callback(err);

        alarm.id = id;
        alarm._id = '' + alarm.serverNO + '_' + alarm.classID + '_' + alarm.id;
        alarm.time = new Date();
        alarm.open_id = guid.create().toString();
        dbAlarm.insert_alarm(alarm, function (err) {
            if (err) {
                logger.error('gen alarm {source: %j, alarm class: %s} save alarm failed:%s', alarm.source, alarm.classID, err.message);
                callback(err);
                return;
            }
            rdbAlarm.set_alarm(alarm);

            notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_generated, alarm));
            alarm_aom_processor.push_alarm(alarm.serverNO, alarm.classID, alarm.id);
            Notification.emit(Emitter.alarm, 'start', alarm);

            callback();
        });
    });
}

function should_gen_alarm(serverNO, classID, id, pointIndex, alarm_classID) {
    var alarm = rdbAlarm.get_alarm_by_point(serverNO, classID, id, pointIndex, alarm_classID);
    if(alarm != undefined){
        return false;
    }else{
        var tag = get_alarm_gen_tag(serverNO, id, pointIndex, alarm_classID);
        return !tag;
    }
}

function try_gen_alarm(alarm, callback) {
    if (alarm.level <= alarm_level.event) {
        gen_alarm(alarm, function (err) {
            if (err) {
                logger.error('gen alarm {source: %j, alarm class: %s} failed:%s', alarm.source, alarm.classID, err.message);
                return callback(err);
            }
            callback();
        });
    } else {
        //标记正在产生告警
        var _source = alarm.source;
        var _serverNO = _source.serverNO;
        var _classID = _source.classID;
        var _id = _source.id;
        var _pointIndex = _source.pointIndex;

        set_alarm_gen_tag(_serverNO, _id, _pointIndex, alarm.classID, true);
        gen_alarm(alarm, function (err) {
            set_alarm_gen_tag(_serverNO, _id, _pointIndex, alarm.classID, false);
            if (err) {
                logger.error('gen alarm {source: %j}save alarm failed:%s', _source, err.message);
                return callback(err);
            }

            callback();
        });
    }
}

function try_end_alarm(alarm, option, callback) {
    var _source = alarm.source;
    var _serverNO = _source.serverNO;
    var _classID = _source.classID;
    var _id = _source.id;
    var _pointIndex = _source.pointIndex;

    if (get_alarm_end_tag(_serverNO, _id, _pointIndex, alarm.classID)) {
        return callback();
    }
    //标记正在结束告警
    set_alarm_end_tag(_serverNO, _id, _pointIndex, alarm.classID, true);
    end_alarm(alarm, option, function (err) {
        set_alarm_end_tag(_serverNO, _id, _pointIndex, alarm.classID, false);
        if (err) {
            logger.error('try end alarm {%j} failed:%s', _source, err.message);
            return callback(err);
        }

        callback();
    });
}


function end_alarm(alarm, option, callback) {
    var now = new Date();
    option.time = now;
    dbAlarm.set_end(alarm.serverNO, alarm.classID, alarm.id, option, now, function (err) {
        if(err){
            logger.error({msg: 'end alarm failed', err: err});
            return callback(err);
        }

        alarm.isEnd = 1;
        alarm.end = option;
        alarm.endTime = option.time;
        alarm.time = now;

        //告警结束后清理缓存
        rdbAlarm.del_alarm(alarm.serverNO, alarm.classID, alarm.id);

        var finished = false;
        //如果告警已确认或强制结束，移动到历史表
        if(alarm.isConfirmed || alarm.isForce){
            finished = true;
            _move_alarm_to_his_data(alarm, now);
        }
        notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_ended, {serverNO: alarm.serverNO, classID: alarm.classID, id: alarm.id, open_id: alarm.open_id, vSource: alarm.vSource, option: option, time: now, finished: finished}));
        alarm_aom_processor.pull_alarm(alarm.serverNO, alarm.classID, alarm.id);
        Notification.emit(Emitter.alarm, 'end', alarm);

        callback();
    });
}

function hangup_alarm(serverNO, classID, id, option, callback) {
    var now = new Date();
    option.time = now;
    dbAlarm.set_hangup(serverNO, classID, id, option, now, function (err, data) {
        if(err) return callback(err);

        // if(data.nModified > 0){
            var alarm = rdbAlarm.get_alarm_sync(serverNO, classID, id);
            if(alarm) {
                alarm.isHangup = 1;
                alarm.hangup = option;
                alarm.time = now;
            }
            notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_hangup, {serverNO: serverNO, classID: classID, id: id, option: option, time: now}));
            alarm_aom_processor.pull_alarm(serverNO, classID, id);

            callback();
        // }else{
        //     callback({msg: 'alarm has hangup or not found'})
        // }
    })
}

function unhangup_alarm(serverNO, classID, id, option, callback) {
    var now = new Date();
    option.time = now;
    dbAlarm.set_unhangup(serverNO, classID, id, option, now, function (err, data) {
        if(err) return callback(err);
        // if(data.nModified > 0) {
            var alarm = rdbAlarm.get_alarm_sync(serverNO, classID, id);
            if (alarm) {
                delete alarm.isHangup;
                delete alarm.hangup;
                alarm.time = now;
            }
            notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_unhangup, {serverNO: serverNO, classID: classID, id: id, option: option, time: now}));
            callback();
        // }else{
        //     callback({msg: 'alarm not hangup'})
        // }
    })
}

function confirm_alarm(serverNO, classID, id, option, callback) {
    var now = new Date();
    option.time = now;
    dbAlarm.set_confirmed(serverNO, classID, id, option, now, function (err, data) {
        if(err) return callback(err);

        // if(data.nModified > 0){
            if(!(classID >= alarm_class.third_party_event && classID <= alarm_class.last_third_party_event)){
                var finished = false;
                var alarm = rdbAlarm.get_alarm_sync(serverNO, classID, id);
                if(alarm && !alarm.isEnd) {
                    alarm.isConfirmed = 1;
                    alarm.confirmed = option;
                    alarm.time = now;
                }else{
                    finished = true;
                    move_alarm_to_his_data(serverNO, classID, id, now);
                }
                notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_confirmed, {serverNO: serverNO, classID: classID, id: id, option: option, time: now, finished: finished}));
                alarm_aom_processor.pull_alarm(serverNO, classID, id);
            }else{
                _check_plugin_third_event_by_self_id(serverNO, classID, id, function (err, finished) {
                    if(err) {
                        logger.error({msg: '', err: err});
                        return;
                    }
                    notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_confirmed, {serverNO: serverNO, classID: classID, id: id, option: option, time: now, finished: finished}));
                    alarm_aom_processor.pull_alarm(serverNO, classID, id);
                })
            }
            callback();
        // }else{
        //     callback({msg: 'alarm has confirmed or not found'});
        // }
    });
}

function force_end_alarm(serverNO, classID, id, option, callback) {
    var now = new Date();
    option.time = now;
    dbAlarm.set_force_end(serverNO, classID, id, option, now, function (err, data) {
        if(err) return callback(err);

        // if(data.nModified > 0){
            var alarm = rdbAlarm.get_alarm_sync(serverNO, classID, id);
            if(!(classID >= alarm_class.third_party_event && classID <= alarm_class.last_third_party_event)) {
                var finished = false;
                if (alarm && !alarm.isEnd) {
                    alarm.isForce = 1;
                    alarm.force = option;
                    alarm.time = now;
                } else {
                    finished = true;
                    move_alarm_to_his_data(serverNO, classID, id, now);
                }
                notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_force_end, {serverNO: serverNO, classID: classID, id: id, option: option, time: now, finished: finished}));
                alarm_aom_processor.pull_alarm(serverNO, classID, id);
            }else{
                _check_plugin_third_event_by_self_id(serverNO, classID, id, function (err, finished) {
                    if(err) {
                        logger.error({msg: '', err: err});
                        return;
                    }
                    notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_force_end, {serverNO: serverNO, classID: classID, id: id, option: option, time: now, finished: finished}));
                    alarm_aom_processor.pull_alarm(serverNO, classID, id);
                })
            }

            callback();
        // }else{
        //     callback({msg: 'alarm has force end or not found'});
        // }
    })
}

function manual_end_alarm(serverNO, classID, id, option, callback) {
    var now = new Date();
    option.time = now;
    dbAlarm.set_end(serverNO, classID, id, option, now, function (err, data) {
        if(err) return callback(err);

        //告警结束后清理缓存
        var alarm = rdbAlarm.del_alarm(serverNO, classID, id);

        // if(data.nModified > 0){
        move_alarm_to_his_data(serverNO, classID, id, now);
        if(alarm == undefined){
            notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_manual_end, {serverNO: serverNO, classID: classID, id: id, option: option, time: now, finished: true}));
        }else{
            notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_manual_end, {serverNO: serverNO, classID: classID, id: id, open_id: alarm.open_id, vSource: alarm.vSource, option: option, time: now, finished: true}));
        }
        alarm_aom_processor.pull_alarm(serverNO, classID, id);

        callback();
        // }else{
        //     callback({msg: 'alarm has force end or not found'});
        // }
    })
}

function add_alarm_convergence(alarm, list) {
    if(list.length <= 0){
        return;
    }

    var now = new Date();
    var identity = {serverNO: alarm.serverNO, classID: alarm.classID, id: alarm.id};
    dbAlarm.add_convergence_list(identity, list, now, function (err) {
        if(err){
            logger.error({msg: 'update alarm avg list failed', err: err});
            //TODO: if update error, rollback parent info
        }

        for(var i=0;i<list.length;i++){
            var item = list[i];
            var _alarm = rdbAlarm.get_alarm_sync(item.serverNO, item.classID, item.id);
            if(_alarm){
                _alarm.isFiltered = 1;
                _alarm.parent = identity;
                _alarm.time = now;
                alarm_aom_processor.pull_alarm(_alarm.serverNO, _alarm.classID, _alarm.id);
            }
        }
        
        notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_convergenced, {serverNO: alarm.serverNO, classID: alarm.classID, id: alarm.id, list: list, time: now}));
    });
}


function move_alarm_to_his_data(serverNO, classID, id, now) {
    dbAlarm.find_alarm({serverNO: serverNO, classID: classID, id: id}, {}, function (err, result) {
        if(err){
            logger.error({msg: 'find alarm failed', err: err});
        }
        var data = undefined;
        if(result && result.length > 0){
            data = result[0];
        }

        if(data){
            var alarm = new Alarm();
            alarm.init_from_row(data);

            _move_alarm_to_his_data(alarm, now);
        }
    })
}

function _move_alarm_to_his_data(alarm, time){
    dbAlarm.delete_alarm(alarm.serverNO, alarm.classID, alarm.id, function (err) {
        if(err){
            logger.error({msg: 'end alarm delete alarm failed', err: err});
        }
        //被过滤的告警重新放出来
        dbAlarm.remove_convergence(alarm.serverNO, alarm.classID, alarm.id, time, function (err) {
            if(err){
                logger.error({msg: 'end alarm insert delete alarm failed', err: err});
            }
        });
        dbHisAlarm.insert_hisalarm(alarm, function (err) {
            if(err){
                logger.error({msg: 'end alarm insert his alarm failed', err: err});
            }
        });
    });
}



function plugin_third_party_event(events) {
    if(events && events.length > 0){
        var alarms = [];

        for(var i=0;i<events.length;i++){
            var item = events[i];
            if(!(item.classID >= alarm_class.third_party_event && item.classID <= alarm_class.last_third_party_event)){
                continue;
            }
            if(!item.source || item.source.serverNO == undefined){
                continue;
            }
            var _alarm = new Alarm();
            _alarm.serverNO = item.source.serverNO;
            _alarm.classID = item.classID;
            // _item.id = 0
            _alarm.source = item.source;
            _alarm.vSource = item.source;
            _alarm.type = item.type;
            _alarm.desc = item.desc;
            _alarm.level = item.level;
            if(item.startTime){
                _alarm.startTime = new Date(item.startTime);
            }
            if(item.start){
                if(item.start.pointValueTime){
                    item.start.pointValueTime = new Date(item.start.pointValueTime)
                }
                _alarm.start = item.start;
            }
            _alarm.third_party_id = item.third_party_id;

            alarms.push(_alarm);
        }
        if(alarms.length > 0){
            ah.each_series(alarms, function (alarm, cbItem) {
                objIDHelper.gen_object_id('alarm', function (err, id) {
                    if(err) return cbItem(err);
                    alarm.id = id;
                    alarm._id = '' + alarm.serverNO + '_' + alarm.classID + '_' + alarm.id;
                    alarm.time = new Date();
                    alarm.open_id = guid.create().toString();
                    dbAlarm.insert_alarm(alarm, function (err) {
                        if (err) {
                            if(err.code == 11000){//重复键<告警重复上传>
                                logger.error('plugin third party alarm[%s] error: duplicate key.', alarm.third_party_id);
                            }else{
                                logger.error('plugin third party alarm[%j] failed', alarm);
                            }
                        }else{
                            notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_generated, alarm));
                            alarm_aom_processor.push_alarm(alarm.serverNO, alarm.classID, alarm.id);
                            Notification.emit(Emitter.alarm, 'start', alarm);
                        }

                        cbItem();
                    });
                })
            }, function (err) {
                if(err) {
                    logger.error({msg: 'gen alarm id failed', err: err});
                }
                alarms = null;
            })
        }
    }
}

function sync_third_party_event_operation(actions) {
    ah.each_series(actions, function (item, cbItem) {
        switch(item.action){
            case 1://自动结束
                var now = new Date();
                var option = item.option;
                option.time = new Date(item.time);
                dbAlarm.update_alarm({third_party_id: item.third_party_id, isEnd: {$ne: 1}}, {$set: {isEnd: 1, endTime: option.time, end: item.option, time: now}}, function (err, data) {
                    if (err) {
                        logger.error({msg: 'end alarm failed', err: err});
                    }

                    if(data && data.nModified > 0) {//如果更新了数据
                        //检查是否已经完成
                        _check_plugin_third_event_by_third_id(item.third_party_id, function (err, alarm, finished) {
                            if (err) {
                                logger.error({msg: 'third event end, check failed', err: err});
                                return;
                            }

                            if(alarm){
                                notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_ended, {serverNO: alarm.serverNO, classID: alarm.classID, id: alarm.id, open_id: alarm.open_id, vSource: alarm.vSource, option: item.option, time: now, finished: finished}));
                                alarm_aom_processor.pull_alarm(alarm.serverNO, alarm.classID, alarm.id);
                                Notification.emit(Emitter.alarm, 'end', alarm);
                            }
                        });
                    }

                    cbItem();
                });
                break;
            default:
                cbItem();
                break;
        }
    }, function (err) {
        if(err) logger.error(err);
    })
}

function _check_plugin_third_event_by_self_id(serverNO, classID, id, callback) {
    dbAlarm.find_alarm({serverNO: serverNO, classID: classID, id: id}, {}, function (err, result) {
        if(err){
            logger.error({msg: 'find alarm failed', err: err});
            return callback(err);
        }
        var data = undefined;
        if(result && result.length > 0){
            data = result[0];
        }

        if(data){
            var alarm = new Alarm();
            alarm.init_from_row(data);

            _check_plugin_third_event(alarm, callback);
        }else{
            callback(null, true);
        }
    })
}

function _check_plugin_third_event_by_third_id(third_party_id, callback) {
    dbAlarm.find_alarm({third_party_id: third_party_id}, {}, function (err, result) {
        if(err){
            logger.error({msg: 'find alarm failed', err: err});
            return callback(err);
        }
        var data = undefined;
        if(result && result.length > 0){
            data = result[0];
        }

        if(data){
            var alarm = new Alarm();
            alarm.init_from_row(data);

            _check_plugin_third_event(alarm, function (err, finished) {
                if(err) return callback(err);
                callback(null, alarm, finished);
            });
        }else{
            callback();
        }
    })
}

function _check_plugin_third_event(alarm, callback) {
    if(alarm.isEnd && (alarm.isConfirmed || alarm.isForce)){
        dbAlarm.delete_alarm(alarm.serverNO, alarm.classID, alarm.id, function (err) {
            if(err){
                logger.error({msg: 'end alarm delete alarm failed', err: err});
            }
            dbHisAlarm.insert_hisalarm(alarm, function (err) {
                if(err){
                    logger.error({msg: 'end alarm insert his alarm failed', err: err});
                }
            });

            callback(err, true);
        });
    }else{
        callback(null, false);
    }
}



function set_alarm_gen_tag(serverNO, id, pointIndex, alarm_classID, value) {
    if(alarm_gen_map[id] == undefined){
        alarm_gen_map[id] = {};
    }
    if(alarm_gen_map[id][pointIndex] == undefined){
        alarm_gen_map[id][pointIndex] = {};
    }
    alarm_gen_map[id][pointIndex][alarm_classID] = value;
}

function get_alarm_gen_tag(serverNO, id, pointIndex, alarm_classID) {
    if(alarm_gen_map[id] == undefined){
        return false;
    }
    if(alarm_gen_map[id][pointIndex] == undefined){
        return false;
    }
    return alarm_gen_map[id][pointIndex][alarm_classID];
}

function set_alarm_end_tag(serverNO, id, pointIndex, alarm_classID, value) {
    if(alarm_end_map[id] == undefined){
        alarm_end_map[id] = {};
    }
    if(alarm_end_map[id][pointIndex] == undefined){
        alarm_end_map[id][pointIndex] = {};
    }
    alarm_end_map[id][pointIndex][alarm_classID] = value;
}

function get_alarm_end_tag(serverNO, id, pointIndex, alarm_classID) {
    if(alarm_end_map[id] == undefined){
        return false;
    }
    if(alarm_end_map[id][pointIndex] == undefined){
        return false;
    }
    return alarm_end_map[id][pointIndex][alarm_classID];
}

function alarm_gen(alarm) {
    if(alarm){
        var _alarm = new Alarm();
        _alarm.load_from_json(alarm);

        rdbAlarm.set_alarm(_alarm);
        alarm_aom_processor.push_alarm(alarm.serverNO, alarm.classID, alarm.id);
        Notification.emit(Emitter.alarm, 'start', _alarm);

        if(alarm.isHangup){
            notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_hangup, {serverNO: alarm.serverNO, classID: alarm.classID, id: alarm.id, option: alarm.hangup, time: new Date()}));
        }
    }
}

function alarm_ended(identity) {
    if(identity){
        let _alarm = rdbAlarm.del_alarm(identity.serverNO, identity.classID, identity.id);
        if(_alarm != undefined){
            Notification.emit(Emitter.alarm, 'end', _alarm, identity);
        }
        alarm_aom_processor.pull_alarm(identity.serverNO, identity.classID, identity.id);
    }
}

function alarm_hanguped(identity) {
    if(identity){
        var _alarm = rdbAlarm.get_alarm_sync(identity.serverNO, identity.classID, identity.id);
        if(_alarm){
            _alarm.isHangup = 1;
        }
        alarm_aom_processor.pull_alarm(identity.serverNO, identity.classID, identity.id);
    }
}

function alarm_unhanguped(identity) {
    if(identity){
        var _alarm = rdbAlarm.get_alarm_sync(identity.serverNO, identity.classID, identity.id);
        if(_alarm){
            _alarm.isHangup = 0;
        }
    }
}

function alarm_confirmed(identity) {
    if(identity){
        rdbAlarm.del_alarm(identity.serverNO, identity.classID, identity.id);
        alarm_aom_processor.pull_alarm(identity.serverNO, identity.classID, identity.id);
    }
}

function alarm_force_ended(identity) {
    if(identity){
        rdbAlarm.del_alarm(identity.serverNO, identity.classID, identity.id);
        alarm_aom_processor.pull_alarm(identity.serverNO, identity.classID, identity.id);
    }
}

function alarm_convergenced(identity) {
    if(identity){
        rdbAlarm.del_alarm(identity.serverNO, identity.classID, identity.id);
        alarm_aom_processor.pull_alarm(identity.serverNO, identity.classID, identity.id);
    }
}

module.exports.hangup_alarm = hangup_alarm;
module.exports.unhangup_alarm = unhangup_alarm;
module.exports.confirm_alarm = confirm_alarm;
module.exports.force_end_alarm = force_end_alarm;
module.exports.manual_end_alarm = manual_end_alarm;
module.exports.add_alarm_convergence = add_alarm_convergence;
module.exports.try_gen_alarm = try_gen_alarm;
module.exports.try_end_alarm = try_end_alarm;

module.exports.should_gen_alarm = should_gen_alarm;
module.exports.plugin_third_party_event = plugin_third_party_event;
module.exports.sync_third_party_event_operation = sync_third_party_event_operation;

module.exports.alarm_gen = alarm_gen;
module.exports.alarm_ended = alarm_ended;
module.exports.alarm_hanguped = alarm_hanguped;
module.exports.alarm_unhanguped = alarm_unhanguped;
module.exports.alarm_confirmed = alarm_confirmed;
module.exports.alarm_force_ended = alarm_force_ended;
module.exports.alarm_convergenced = alarm_convergenced;
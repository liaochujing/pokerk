/**
 * Created by wangxh on 2018/4/9.
 */

'use strict';

var util = require('util');
var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var serverType = require('../../../definition/service_type');
var sysConfigKey = require('../definition/system_config_key');

var NoticeType = require('../../../definition/notice_type');
var uiclassID = require('../../../definition/uiClassID');

var db = require('../../../db');
var dbAlarm = db.alarm;
var ramdb = db.ramdb;
var rdbOO = db.ramdb.oo;
var rdbCFG = db.ramdb.cfg;

var dataHelper = require('../../../protocol/central/server_manager');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');

// var config = {
//     time: 0,
//     list: [
//         {user: 0, state: 1, points: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}]}
//     ]
// };

const _notice_type = NoticeType.message;//1：钉钉，2：邮件，3：短信
var msgHelper = require('../../../helpers/message_helper');


function get_recipient(contact) {
    switch(_notice_type){
        case NoticeType.dingding:
            return contact.dd;
        case NoticeType.email:
            return contact.email;
        case NoticeType.message:
            return contact.tel;
        default:
            return undefined;
    }
}

function start_process() {

    function notify(config) {
        var _state = undefined;
        var _notifyList = [];
        var _ssidList = [];

        var get_service_state = function (configItem, done) {
            if(_state){
                done(null, _state);
                return;
            }
            if(configItem.state){
                //TODO: 获取系统运行状态.
                var buildings = ramdb.no.get_by_class(uiclassID.building);

                if(buildings && buildings.length > 0){
                    var _list = [];
                    for(var i=0;i<buildings.length;i++){
                        var _b = buildings[i];
                        _list.push({serverNO: _b.serverNO, classID: _b.classID, id: _b.id});
                    }
                    var msg = new DataMessage(CentralCMD.cen_0x0000000B);
                    dataHelper.send(msg, function (err, result) {
                        if(err) return done(err);

                        var _res = [];
                        var _buildingDic = {};
                        if(result) {
                            for (var i = 0; i < result.length; i++) {
                                var _item = result[i];
                                _buildingDic[format_key(_item.serverNO, _item.classID, _item.id)] = _item;
                            }
                        }

                        for(var i=0;i<buildings.length;i++){
                            var _building = buildings[i];
                            var _item = _buildingDic[format_key(_building.serverNO, _building.classID, _building.id)];

                            var desc = '';
                            if(_item){
                                var connections = _item.connections;
                                if(connections){
                                    var _dic = {};
                                    for(var j=0;j<connections.length;j++){
                                        var conn = connections[j];
                                        if(_dic[conn.type]){
                                            _dic[conn.type]++;
                                        }else{
                                            _dic[conn.type] = 1;
                                        }
                                    }
                                    if(!_dic[serverType.data]){
                                        desc+='数据中控';
                                    }
                                    // if(!_dic[serverType.collect]){
                                    //     if(desc){
                                    //         desc+='、'
                                    //     }
                                    //     desc+='采集模块';
                                    // }
                                    if(!_dic[serverType.alarm]){
                                        if(desc){
                                            desc+='、'
                                        }
                                        desc+='告警模块';
                                    }
                                    if(desc){
                                        desc+='异常'
                                    }
                                }else{
                                    desc = '通讯故障';
                                }
                            }else{
                                desc = '通讯故障';
                            }

                            if(!desc){
                                desc = '服务运行正常'
                            }
                            if(_building){
                                _res.push({serverNO: _building.serverNO, classID: _building.classID, id: _building.id, name: _building.fullName, desc: desc});
                            }
                        }
                        _state = _res;

                        done(null, _res);
                    });
                }else{
                    done();
                }
            }else{
                done();
            }
        };

        var get_state_info = function (done) {
            ah.each_series(config.list, function (configItem, cbItem) {
                var _dic = {};
                var _notifyItem = {alarms: [], user: configItem.user};
                for(var j=0;j<configItem.points.length;j++){
                    var _p = configItem.points[j];
                    var _key = format_key(_p.serverNO, _p.id, _p.pointIndex);
                    _dic[_key] = 1;
                }
                _ssidList.push(_dic);
                _notifyList.push(_notifyItem);

                if(configItem.state){
                    get_service_state(configItem, function (err, _state) {
                        if(err){
                            return cbItem(err);
                        }
                        _notifyItem.state = _state;

                        cbItem();
                    })
                }else{
                    cbItem();
                }
            }, function () {
                done();
            })
        };

        var get_alarm_info = function (done) {
            ah.each_series(config.list, function (configItem, cbItem) {
                var _sl = [];
                for(var j=0;j<configItem.points.length;j++){
                    var _p = configItem.points[j];
                    _sl.push({'source.serverNO': _p.serverNO, 'source.classID': _p.classID, 'source.id': _p.id, 'source.pointIndex': _p.pointIndex});
                }
                dbAlarm.find_alarm({$or: _sl, isEnd: null, isForce: null, isConfirmed: null, isFiltered: null}, {_id: 0, serverNO: 1, classID: 1, id: 1, source: 1, desc: 1, startTime: 1}, function (err, results) {
                    if(err) return cbItem(err);
                    
                    for(var i=0;i<results.length;i++){
                        var alarm = results[i];
                        var source = alarm.source;
                        var _key = format_key(source.serverNO, source.id, source.pointIndex);

                        for(var j=0;j<_ssidList.length;j++){
                            var _cItem = _ssidList[j];
                            if(_cItem[_key]){
                                _notifyList[j].alarms.push({serverNO: alarm.serverNO, classID: alarm.classID, id: alarm.id, desc: alarm.desc, startTime: alarm.startTime});
                                break;
                            }
                        }
                    }

                    cbItem();
                })
            }, function (err) {
                if(err){
                    logger.error({msg: 'schedule notify get alarm failed', err: err});
                }

                done();
            });
            // var alarms = rdbAlarm.get_all_alarm();
            // for(var i=0;i<alarms.length;i++){
            //     var alarm = alarms[i];
            //     if(!alarm._ssid){
            //         if(alarm.source){
            //             var source = alarm.source;
            //             alarm._ssid = format_key(source.serverNO, source.id, source.pointIndex)
            //         }else{
            //             continue;
            //         }
            //     }
            //     for(var j=0;j<_ssidList.length;j++){
            //         var _cItem = _ssidList[j];
            //         if(_cItem[alarm._ssid]){
            //             _notifyList[j].alarms.push({serverNO: alarm.serverNO, classID: alarm.classID, id: alarm.id, desc: alarm.desc, startTime: alarm.startTime});
            //             break;
            //         }
            //     }
            // }
            // done();
        };

        ah.series([get_state_info, get_alarm_info], function (err) {
            if(err){
                logger.error({msg: 'get schedule data failed', err: err});
                return;
            }
            var temp = {
                user: 0,
                alarms: [],
                state: []
            };
            //TODO: 发送通知
            ah.each_series(_notifyList, function (notifyItem, cbItem) {
                var recipient = undefined;
                var operator = rdbOO.get_operator_by_id(notifyItem.user);
                if(operator && operator.contact){
                    recipient = get_recipient(operator.contact);
                }
                if(recipient){
                    var _alarmNotify = '';
                    var _stateNotify = '';
                    if(notifyItem.alarms){
                        for(var i=0;i<notifyItem.alarms.length;i++){
                            var _item = notifyItem.alarms[i];
                            _alarmNotify+=util.format('[%s]%s\r\n', _item.startTime.format_datetime(), _item.desc);
                        }
                    }
                    if(notifyItem.state){
                        for(var i=0;i<notifyItem.state.length;i++){
                            var _item = notifyItem.state[i];
                            _stateNotify+=util.format('[%s]%s \r\n', _item.name, _item.desc);
                        }
                    }

                    var title = '定时通知';
                    var content = '';
                    if(!_alarmNotify){
                        _alarmNotify = '没有指定告警产生';
                    }
                    content+='告警:\r\n';
                    content+=_alarmNotify;
                    if(!_stateNotify) {
                        _stateNotify = '系统运行正常'
                    }
                    content+='\r\n';
                    content+='系统状态:\r\n';
                    content+=_stateNotify;

                    ah.retry({times: 3, interval: 1000}, function (cb) {
                        msgHelper.send_message(_notice_type, recipient, title, content, function (err) {
                            if(err){
                                logger.error({msg: 'send notify failed', err: err});
                            }
                            cb(err);
                        })
                    }, function () {
                        cbItem();
                    })
                }else{
                    cbItem();
                }
            }, function () {
                
            })
        })
    }
    
    function schedule_next() {
        var now = new Date();
        var day = now.GetDate();
        var interval = now - day;

        var mins = parseInt((interval) / 1000 / 60);//分钟数
        var config = rdbCFG.get_system_config(sysConfigKey.schedule_alarm_config);
        if(config && config.time){
            if(config.time.indexOf(mins) >= 0){
                notify(config);
            }
        }

        var _next = (mins + 1) * 60 * 1000 + 1000;
        setTimeout(function () {
            schedule_next();
        }, _next - interval);
    }

    setTimeout(function () {
        schedule_next();
    }, 3000)
}

module.exports.start_process = start_process;
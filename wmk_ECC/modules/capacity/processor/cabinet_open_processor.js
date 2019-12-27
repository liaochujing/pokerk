/**
 * Created by wangxh on 2018/3/6.
 */

'use strict';

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db');
var ramdb = db.ramdb;
var dbNO = db.no;
var dbCAPSL = db.datadb.capsl;

var deviceHelper = require('../../../helpers/device_helper');
var serverHelper = require('../../../protocol/central/interface_helper');

const process_interval = 5 * 60 * 1000;
const _cal_per_count = 300;

//修改机柜开通状态
function update_cabinet_open_state(cabinet, state, time, callback) {
    dbNO.update({serverNO: cabinet.serverNO, classID: cabinet.classID, id: cabinet.id}, {$set: {'restData.isOpen': state, 'restData.openTime': time}}, function (err) {
        if(err) logger.error(err);

        cabinet.isOpen = 1;
        cabinet.openTime = time;

        callback();
    });
}

//修改机柜上电状态
function update_cabinet_power_state(cabinet, state, time, callback) {
    dbNO.update({serverNO: cabinet.serverNO, classID: cabinet.classID, id: cabinet.id}, {$set: {'restData.isPowerOn': state, 'restData.powerTime': time}}, function (err) {
        if(err) return callback(err);

        cabinet.isPowerOn = state;
        cabinet.powerTime = time;

        callback();
    })
}

function start_process() {
    setInterval(function () {
        //TODO:优化取点值次数
        var cabinets = ramdb.no.get_by_class(uiclassID.cabinet);
        if(!cabinets || cabinets.length <= 0){
            return;
        }

        var _calList = [];
        var _serverNO = cabinets[0].serverNO;
        var _list = [];
        for(var i=0;i<cabinets.length;i++){
            var _item = cabinets[i];

            if(_item.serverNO != _serverNO){
                if(_list.length > 0){
                    _calList.push({serverNO: _serverNO, list: _list});
                    _list = [];
                }
                _serverNO = _item.serverNO;
            }else if(_list.length >= _cal_per_count){
                _calList.push({serverNO: _serverNO, list: _list});
                _list = [];
            }
            _list.push(_item);
        }
        if(_list.length > 0){
            _calList.push({serverNO: _serverNO, list: _list});
        }

        ah.each_series(_calList, function (item, cbItem) {
            var _cabinets = [];
            var identitys = {};
            for(var i=0;i<item.list.length;i++){
                var cabinet = item.list[i];
                var config = deviceHelper.get_device_type_config(cabinet);
                if(config && config.switchs && config.switchs.length > 0) {
                    identitys[cabinet.id] = config.switchs;//开关
                    _cabinets.push(cabinet);
                }
            }
            if(_cabinets.length > 0){
                var now = new Date();
                serverHelper.get_point_value(item.serverNO, identitys, function (err, data) {
                    if(err) logger.error(err);

                    var now = new Date();
                    ah.each_series(_cabinets, function (cabinet, cbNextCabinet) {
                        if(data && data[cabinet.id]){
                            var isAnyON = 0;//是否有闭合的

                            var pvDic = data[cabinet.id];
                            var config = deviceHelper.get_device_type_config(cabinet);
                            if(config && config.switchs){
                                for(var i=0;i<config.switchs.length;i++){
                                    var pointIndex = config.switchs[i];
                                    var pv = pvDic[pointIndex];
                                    if(pv != undefined){
                                        if(pv == 1){//闭合
                                            isAnyON = 1;
                                            break;
                                        }
                                    }
                                }
                            }

                            if(!cabinet.isOpen && isAnyON){
                                update_cabinet_open_state(cabinet, 1, now, function (err) {
                                    if(err) logger.error({msg: 'update cabinet open state failed', err: err});
                                });
                            }
                            if(cabinet.isPowerOn != isAnyON){
                                var _isPowerOn = cabinet.isPowerOn;
                                var _powerTime = cabinet.powerTime;
                                update_cabinet_power_state(cabinet, isAnyON, now, function (err) {
                                    if(err) logger.error({msg: 'update cabinet open state failed', err: err});

                                    if(!_isPowerOn){
                                        dbCAPSL.insert_log(cabinet.serverNO, cabinet.classID, cabinet.id, parent.id, _powerTime, now, function (err) {
                                            if(err) logger.error({msg: 'save cabinet power state log failed', err: err});
                                        })
                                    }
                                })
                            }
                        }
                        cbNextCabinet();
                    }, function () {
                        cbItem();
                    });
                });
            }else{
                cbItem();
            }
        }, function () {
            
        })
    }, process_interval)
}

module.exports.start_process = start_process;
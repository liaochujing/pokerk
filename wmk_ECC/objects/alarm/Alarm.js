/**
 * Created by wangxh on 2017/9/19.
 */

'use strict';

var AlarmClass = require('../../definition/alarm_class');

var db = require('../../db');
var datadb = db.datadb;

function Alarm() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = AlarmClass.alarm;
    this.id = 0;

    this.type = 0;//告警分类(大类)
    this.source = {};
    this.level = 0;
    this.startTime = undefined;
    this.endTime = undefined;
    this.desc = '';
    
    // this.time = undefined;//时间戳
}

// Alarm.prototype.insert_db = function (callback) {
//     var a = db.alarm;
//     var self = this;
//
//     a.insert_alarm(self, function (err) {
//         if(err) return callback(err);
//         callback();
//     });
// };
//
// Alarm.prototype.insert_db_his = function (callback) {
//     datadb.hisalarm.insert_hisalarm(this, function (err) {
//         callback(err);
//     })
// };
//
// Alarm.prototype.delete_db = function (callback) {
//     var a = db.alarm;
//     a.delete_alarm(this.serverNO, this.classID, this.id, callback)
// };

Alarm.prototype.init_from_row = function (item) {
    this._id = item._id;
    this.serverNO = item.serverNO;
    this.classID = item.classID;
    this.id = item.id;
    this.open_id = item.open_id;

    this.area = item.area;
    this.type = item.type;

    this.source = item.source;
    this.vSource = item.vSource;
    this.level = item.level;
    this.desc = item.desc;

    this.startTime = item.startTime;
    if(item.endTime != undefined){
        this.endTime = item.endTime;
    }

    this.start = item.start;
    if(item.isEnd != undefined){
        this.isEnd = item.isEnd;
    }
    if(item.end != undefined){
        this.end = item.end;
    }
    if(item.manual_end != undefined){
        this.manual_end = item.manual_end;
    }

    if(item.isForce != undefined) {
        this.isForce = item.isForce;
    }
    if(item.force != undefined) {
        this.force = item.force;
    }

    if(item.isConfirmed != undefined) {
        this.isConfirmed = item.isConfirmed;
    }
    if(item.confirmed != undefined) {
        this.confirmed = item.confirmed;
    }

    if(item.isHangup != undefined){
        this.isHangup = item.isHangup;
    }
    if(item.hangup != undefined){
        this.hangup = item.hangup;
    }
    if(item.unhangup != undefined){
        this.unhangup = item.unhangup;
    }

    if(item.isFiltered){
        this.isFiltered = item.isFiltered;
    }
    if(item.parent != undefined){
        this.parent = item.parent;
    }

    if(item.star != undefined){
        this.star = item.star;//标记
    }
    if(item.notify != undefined){
        this.notify = item.notify;//通知信息
    }
    if(item.order != undefined){
        this.order = item.order;//工单信息
    }
    if(item.third_party_id){//第三方告警事件ID
        this.third_party_id = item.third_party_id;
    }

    this.time = item.time;//时间戳
};

Alarm.prototype.load_from_json = function (alarm) {
    if(alarm.startTime){
        alarm.startTime = new Date(alarm.startTime);
    }
    if(alarm.endTime){
        alarm.endTime = new Date(alarm.endTime);
    }
    if(alarm.time){
        alarm.time = new Date(alarm.time);
    }
    if(alarm.start){
        if(alarm.start.time){
            alarm.start.time = new Date(alarm.start.time);
        }
        if(alarm.start.pointValueTime){
            alarm.start.pointValueTime = new Date(alarm.start.pointValueTime);
        }
    }
    if(alarm.hangup){
        if(alarm.hangup.time){
            alarm.hangup.time = new Date(alarm.hangup.time);
        }
    }
    if(alarm.confirmed){
        if(alarm.confirmed.time){
            alarm.confirmed.time = new Date(alarm.confirmed.time);
        }
    }
    if(alarm.end){
        if(alarm.end.time){
            alarm.end.time = new Date(alarm.end.time);
        }
        if(alarm.end.pointValueTime){
            alarm.end.pointValueTime = new Date(alarm.end.pointValueTime);
        }
    }
    if(alarm.force){
        if(alarm.force.time){
            alarm.force.time = new Date(alarm.force.time);
        }
    }
    this.init_from_row(alarm);
};

module.exports = Alarm;
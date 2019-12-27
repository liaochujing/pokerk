/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var Order = require('./Order');

function AlarmOrder() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.alarmOrder;

    this.restData = {};
    this.operationList = [];
    this.users = [];
    this.notifyInfo = {};
}

AlarmOrder.prototype = new Order();

AlarmOrder.prototype._schema = {
    extend: {
        alarm: 'object',//告警ID
        source: 'object',//告警源
        desc: 'object',//告警描述
        startTime: 'datetime',//告警开始时间
        endTime: 'datetime'//告警结束时间
    }
};

module.exports = AlarmOrder;
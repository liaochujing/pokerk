/**
 * Created by wangxh on 2017/9/20.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var DevicePoint = require('./DevicePoint');

function AlarmPoint() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.alarmPoint;
}

AlarmPoint.prototype = new DevicePoint();

module.exports = AlarmPoint;
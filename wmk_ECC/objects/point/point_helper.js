/**
 * Created by wangxh on 2017/7/26.
 */

'use strict';

var logger = require('../../util/log_manager').logger;
var uiclassID = require('../../definition/uiClassID');

var _pointDic = {};

_pointDic[uiclassID.devicePoint] = require('./DevicePoint');
_pointDic[uiclassID.alarmPoint] = require('./AlarmPoint');

function createDevicePoint(classID) {
    var constructor = _pointDic[classID];
    var nameObject = null;

    if (constructor != undefined) {
        nameObject = new constructor();
    }

    if (!nameObject) {
        logger.error('create device point object {classID:%d} failed', classID);
    }

    return nameObject;
}

module.exports.createDevicePoint = createDevicePoint;
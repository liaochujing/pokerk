/**
 * Created by wangxh on 2017/11/22.
 */

'use strict';

var util = require('util');
var uiclassID = require('../../definition/uiClassID');
var cDevice = require('./cDevice');

function cS80Device() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.cS80Device;
}

cS80Device.prototype = new cDevice();

module.exports = cS80Device;
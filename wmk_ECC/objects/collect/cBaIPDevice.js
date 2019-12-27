/**
 * Created by wangxh on 2017/11/22.
 */

'use strict';

var util = require('util');
var uiclassID = require('../../definition/uiClassID');
var cDevice = require('./cDevice');

function cBaIPDevice() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.cBaIPDevice;

    // this.identifier = '';
}

cBaIPDevice.prototype = new cDevice();

module.exports = cBaIPDevice;
/**
 * Created by wangxh on 2017/7/19.
 */
'use strict';

var uiclassID = require('../../definition/uiClassID');
var NameObject = require('../NameObject');

function GeneralDevice() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.generalDevice;
}

GeneralDevice.prototype = new NameObject();

module.exports = GeneralDevice;
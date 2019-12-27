/**
 * Created by wangxh on 2017/7/19.
 */
'use strict';

var uiclassID = require('../../definition/uiClassID');

var Device = require('./Device');

var base = Device.prototype;

function Temp() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.Temp;
}

Temp.prototype = new Device();

Temp.prototype._schema = {
    base: base._schema,
    extend: {
        enTHType: 'number',//温湿度类型
    }
};

module.exports = Temp;
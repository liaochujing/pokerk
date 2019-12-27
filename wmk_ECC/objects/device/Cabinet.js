/**
 * Created by wangxh on 2017/10/23.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var Device = require('./Device');

var base = Device.prototype;

function Cabinet() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.cabinet;
}

Cabinet.prototype = new Device();

Cabinet.prototype._schema = {
    base: base._schema,
    extend: {
        cabType: 'number',//机柜类型
        spec: 'number',//规格(U位数)
        pdu: 'number',
        isPowerOn: 'number',    //是否上电
        powerTime: 'datetime',  //上电时间
        isOpen: 'number',       //是否开通
        openTime: 'datetime'    //开通时间
    }
};

module.exports = Cabinet;
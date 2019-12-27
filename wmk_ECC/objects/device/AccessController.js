/**
 * Created by wangxh on 2017/10/23.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var GeneralDevice = require('./GeneralDevice');

function AccessController() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.acc_controller;
}

AccessController.prototype = new GeneralDevice();

AccessController.prototype._schema = {
    extend: {
        type: 'integer',//控制器类型(type=1表示添加的是大华设备；type=0表示添加的是支持腾讯协议的设备)
        option: 'object'//控制器参数{host: '', port: 0, device: '', user: '', pass: '', opid: 0, opname: ''}
    }
};

module.exports = AccessController;
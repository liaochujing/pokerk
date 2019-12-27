/**
 * Created by wangxh on 2017/11/22.
 */

'use strict';

var util = require('util');
var uiclassID = require('../../definition/uiClassID');
var cDevice = require('./cDevice');

function cBaDevice() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.cBaDevice;

    // bIPAdress: '127.0.0.1', //IP地址
    // bPort: 3000,            //端口
    // protocol_type: 'http',  //连接协议类型(http/https)
    // username: 'admin',      //用户名
    // password: '123456',     //密码
    // token_url_part:'/NBWSITest/NorthboundWebApiClient', //token url
    // signalr_server_url:'xxx',  //signalr服url
    // signalr_backendurl:'xxxx'  //signalr集线器url
}

cBaDevice.prototype = new cDevice();

module.exports = cBaDevice;
/**
 * Created by wangxh on 2017/11/22.
 */

'use strict';

var util = require('util');
var uiclassID = require('../../definition/uiClassID');
var cObject = require('./cObject');

var base = cObject.prototype;
var db = require('../../db/index');

function cDevice() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.cDevice;

    // this.modifyTime = def.defaultDate;
    // this.createTime = def.defaultDate;
}

cDevice.prototype = new cObject();

cDevice.prototype._schema = {
    extend: {
        //采集配置
        type: 'integer',//设备类型
        serial_no: 'string',//序列号、MAC地址
        cMode: 'integer',//采集方式
        cOption: 'object',//采集参数
        cInterval: 'integer',//采集间隔
        cDelay: 'integer',//采集延时
        cTimeout: 'integer',//采集超时时间
        config: 'object',//配置信息
        parent: 'object' //父对象(采集器) {serverNO:1,classID:1,id:1}
    }
};

cDevice.prototype.delete_db = function (callback) {
    var self = this;
    base.delete_db.call(this, function (err) {
        if(err) return callback(err);
        self.clear_point_list(callback);
    });
};

cDevice.prototype.clear_point_list = function (callback) {
    var dbCDP = db.cdp;
    dbCDP.clear_collect_device_point(this.serverNO, this.classID, this.id, callback)
};

module.exports = cDevice;
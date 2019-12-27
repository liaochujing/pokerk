/**
 * Created by wangxh on 2017/11/22.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var collectorType = require('../../definition/collector_type');
var cDevice = require('./cDevice');

var base = cDevice.prototype;

function Collector() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.collector;
    this.colType = collectorType.DataCollector;//默认为一体化数据采集器

    // this.com_param = {//串口配置
    //     'COM1': {
    //         cInterval: 3000,//采集间隔
    //         intMode: 0//采集错误，重新开始
    //     },
    //     'COM2': {
    //         cInterval: 3000,//采集间隔
    //         intMode: 0//采集错误，重新开始
    //     }
    // }
    // this.err_param = {//异常参数配置
    //     timeout: {
    //         default: 1000,//默认值
    //     },
    //     retry: {
    //         default: 3
    //     }
    // }
    // this.ntp_param = {
    //     host: '192.168.1.1'
    // }
}

Collector.prototype = new cDevice();

Collector.prototype._schema = {
    base: base._schema,
    extend: {
        colType: 'number',//采集器类型
        guid: 'string',//标识

        csIPAddress: 'string',//采集服务IP
        csPort: 'number',//采集服务端口
        calExp: 'number',//是否计算表达式

        com_param: 'object',//串口配置
        err_param: 'object',//异常参数配置
        ntp_param: 'object',//ntp服务配置

        other_param: 'object',//其他配置
    }
};

module.exports = Collector;
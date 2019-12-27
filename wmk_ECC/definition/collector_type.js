/**
 * Created by wangxh on 2018/4/8.
 */

'use strict';

module.exports = {
    DataCollector   : 1,//一体化数据采集器
    Bacnet           : 2,//Bacnet对接服务
    S80               : 3,//S80辅助服务
    snmp              : 4,//snmp辅助服务
    BacnetIP          : 5,//bacnet ip辅助服务
    OPC                :6,//OPC辅助服务
    AlarmHost                :7,//告警主机
    DataCollector_Com20       :8,//一体化数据采集器(20串口)
    cloud       :9,//云采集器(添加的设备可能不在采集器下)
};
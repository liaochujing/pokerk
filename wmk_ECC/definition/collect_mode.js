/**
 * Created by wangxh on 2017/7/27.
 */

'use strict';

/**
 * 采集方式
 * @type {{none: number, mtcp: number, mcom: number, dido: number, snmp: number, bacnet: number}}
 */
var col_mode = {
    none: 0,//不采集

    mtcp: 1,//modbus-tcp
    mcom: 2,//modbus-com
    dido: 3,//dido采集
    snmp: 4,//snmp采集
    bacnet: 5,//bacnet采集
    bacnetIP: 6,//bacnet ip采集
    opc: 7,//OPC采集
    http: 8,//报警主机采集单元
    auto_report: 9,//自动上传(串口风机)
    auto_tsi: 10,//自动上传(亿天TSI)

    modbus_tcp_io: 11,//IO模块（modbus tcp 主动连接）
    modbus_dtu: 12,//DTU子设备（modbus dtu）:{address: 0}
    modbus_cs: 13,//CS子设备（modbus cs）:{address: 0}
};

module.exports = col_mode;
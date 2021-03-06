/**
 * Created by wangxh on 2017/5/17.
 */

'use strict';

var data_cmd = {
    //登陆验证
    data_0x00000001: 0x00000001, //验证
    data_0x00000002: 0x00000002, //保活

    data_0x00010001: 0x00010001, //查询实时点值(设备)
    data_0x00010002: 0x00010002, //查询实时点值(设备点)
    data_0x00010003: 0x00010003, //查询设备状态
    data_0x00010004: 0x00010004, //查询设备状态

    data_0x00010005: 0x00010005, //注册点值通知(设备)
    data_0x00010006: 0x00010006, //注销点值通知(设备)

    data_0x00030001: 0x00030001, //查询授权状态
    data_0x00030002: 0x00030002, //下载授权文件
    data_0x00030003: 0x00030003, //上传授权文件
};

module.exports = data_cmd;
/**
 * Created by wangxh on 2017/7/26.
 */

'use strict';

var alm_cmd = {
    alm_0x00000001: '0x00000001',//确认告警
    alm_0x00000002: '0x00000002',//结束告警
    alm_0x00000003: '0x00000003',//挂起告警
    alm_0x00000004: '0x00000004',//解挂告警
    alm_0x00000005: '0x00000005',//标记告警
    alm_0x00000006: '0x00000006',//手动结束告警
    alm_0x00000007: '0x00000007',//停止声光警号

    alm_0x00010001: '0x00010001',//挂起设备点
    alm_0x00010002: '0x00010002',//屏蔽告警点
    alm_0x00010003: '0x00010003',//告警类型设置
    alm_0x00010004: '0x00010004',//告警类型删除
    alm_0x00010005: '0x00010005',//告警类型列表获取
    alm_0x00010006: '0x00010006',//告警类型获取(简单列表)
    alm_0x00010007: '0x00010007',//告警收敛配置
    alm_0x00010008: '0x00010008',//告警收敛获取
    alm_0x00010009: '0x00010009',//告警屏蔽配置
    alm_0x00010010: '0x00010010',//告警屏蔽获取
    alm_0x00010011: '0x00010011',//告警通知配置
    alm_0x00010012: '0x00010012',//告警通知获取
    alm_0x00010013: '0x00010013',//定时通知配置
    alm_0x00010014: '0x00010014',//定时通知获取
    alm_0x00010015: '0x00010015',//声光警号配置
    alm_0x00010016: '0x00010016',//声光警号获取
    alm_0x00010017: '0x00010017',//告警通知规则配置
    alm_0x00010018: '0x00010018',//告警通知规则获取

    alm_0x00020001: '0x00020001',//告警（待处理）数量查询（实时）(按类型分组)
    alm_0x00020002: '0x00020002',//实时（待处理）告警查询（实时）
    alm_0x00020003: '0x00020003',//历史告警查询（历史）
    alm_0x00020004: '0x00020004',//告警统计(当日)
    alm_0x00020005: '0x00020005',//告警统计(当月)
    alm_0x00020006: '0x00020006',//实时告警详情
    alm_0x00020007: '0x00020007',//实时告警查询（实时）(精简)
    alm_0x00020008: '0x00020008',//实时告警查询（实时+过滤）(精简)
    alm_0x00020009: '0x00020009',//实时子告警查询（实时）(精简)
    alm_0x00020010: '0x00020010',//告警（待处理）数量查询（设备）
    alm_0x00020011: '0x00020011',//告警（待处理）数量查询（设备点）
    alm_0x00020012: '0x00020012',//实时告警查询（实时）
    alm_0x00020013: '0x00020013',//告警历史曲线
    alm_0x00020014: '0x00020014',//告警操作记录

    alm_0x00020015: '0x00020015',//告警（待处理）数量查询（实时）(按区域分组,前100)
    alm_0x00020016: '0x00020016',//告警（待处理）数量查询（实时）(指定区域,按告警等级分组)

    alm_0x00030001: '0x00030001',//华润告警通知配置设置
    alm_0x00030002: '0x00030002',//华润告警通知配置获取
    alm_0x00030003: '0x00030003',//兴海设备设施告警通知配置设置
    alm_0x00030004: '0x00030004',//兴海设备设施告警通知配置设置
};

module.exports = alm_cmd;
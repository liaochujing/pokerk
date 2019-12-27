/**
 * Created by wangxh on 2017/11/14.
 */

'use strict';

module.exports = {
    addOperator: 11,
    removeOperator: 12,
    modifyOperator: 13,
    queryOperator: 14,

    addOperatorGroup: 21,
    removeOperatorGroup: 22,
    modifyOperatorGroup: 23,
    queryOperatorGroup: 24,

    addAsset: 31,
    removeAsset: 32,
    modifyAsset: 33,
    queryAsset: 34,
    onShelves: 35,
    offShelves: 36,
    inStorage: 37,//入库
    outStorage: 38,//出库
    assetUse: 39,//使用、停用
    assetMaintain: 40,//维护、修复
    assetScrap: 41,//报废、撤销

    addObject: 101,
    removeObject: 102,
    modifyObject: 103,
    queryObject: 104,

    addCollectDevice: 211,
    removeCollectDevice: 212,
    modifyCollectDevice: 213,
    queryCollectDevice: 214,

    addDeviceType: 301,
    removeDeviceType: 302,
    modifyDeviceType: 303,
    queryDeviceType: 304,

    addCollectDeviceType: 311,
    removeCollectDeviceType: 312,
    modifyCollectDeviceType: 313,
    queryCollectDeviceType: 314,

    // queryPoint: 401,
    shieldPoint: 402,//屏蔽
    hangupPoint: 403,//挂起
    controlPoint: 404,//控制

    queryReport: 501,

    addReportTemplate: 601,
    removeReportTemplate: 602,
    modifyReportTemplate: 603,
    queryReportTemplate: 604,

    confirmNoticeAlarm: 702,
    endNoticeAlarm: 703,
    hangupNoticeAlarm: 704,
    manualEndNoticeAlarm: 705,

    confirmNormalAlarm: 712,
    endNormalAlarm: 713,
    hangupNormalAlarm: 714,
    manualEndNormalAlarm: 715,

    confirmImportantAlarm: 722,
    endImportantAlarm: 723,
    hangupImportantAlarm: 724,
    manualEndImportantAlarm: 725,

    confirmUrgentAlarm: 732,
    endUrgentAlarm: 733,
    hangupUrgentAlarm: 734,
    manualEndUrgentAlarm: 735,

    addAlarmType: 741,
    removeAlarmType: 742,
    modifyAlarmType: 743,
    queryAlarmType: 744,

    setAlarmShield: 751,//告警屏蔽配置
    getAlarmShield: 752,//查询

    setAlarmConvergence: 761,//告警过滤配置
    getAlarmConvergence: 762,//查询
    
    addOrder: 801,
    queryOrder: 802,
    receiveOrder: 803,
    handleOrder: 804,
    rollbackOrder: 805,
    finishOrder: 806,

    getOrderConfig: 811,
    setOrderConfig: 812,

    setLink: 901,
    queryLink: 902,

    queryLog: 1001,

    setAlarmNotify: 1401, //告警通知配置
    getAlarmNotify: 1402, //告警通知获取
};
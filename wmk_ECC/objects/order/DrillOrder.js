/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var Order = require('./Order');

function DrillOrder() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.drillOrder;

    this.restData = {};
    this.operationList = [];
    this.users = [];
    this.notifyInfo = {};
}

DrillOrder.prototype = new Order();

DrillOrder.prototype._schema = {
    extend: {
        type: 'number',//类型(年度、季度、月度)
        area: 'object',//演练区域
        time: 'string',//响应年、季、月度
        content: 'string',//内容
        participant: 'array',//参与者
        planTime: 'datetime',//计划日期
        mTime: 'datetime'//实际时间
    }
};

module.exports = DrillOrder;
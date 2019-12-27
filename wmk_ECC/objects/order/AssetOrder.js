/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var Order = require('./Order');

function AssetOrder() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.assetOrder;

    this.restData = {};
    this.operationList = [];
    this.users = [];
    this.notifyInfo = {};
}

AssetOrder.prototype = new Order();

AssetOrder.prototype._schema = {
    extend: {
        type: 'number',//类型（年度，季度，月度）
        asset: 'object',//资产
        template: 'string',//模板
        maintain: 'number',//运维人员
        timeSlot: 'object',//时间段
        planTime: 'datetime',//计划日期
        mTime: 'datetime',//实际时间
    }
};

module.exports = AssetOrder;
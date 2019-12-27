/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var Order = require('./Order');

function OffPowerOrder() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.offPowerOrder;

    this.restData = {};
    this.operationList = [];
    this.users = [];
    this.notifyInfo = {};
}

OffPowerOrder.prototype = new Order();

OffPowerOrder.prototype._schema = {
    extend: {
        starter: 'string',//发起人
        contact: 'string',//联系人
        planTime: 'datetime',//要求完成时间
        mTime: 'datetime',//实际时间
        group: 'integer',//责任班组
        content: 'string',//内容
    }
};

module.exports = OffPowerOrder;
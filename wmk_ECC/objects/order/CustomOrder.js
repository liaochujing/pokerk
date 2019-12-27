/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var Order = require('./Order');

function CustomOrder() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.customOrder;

    this.restData = {};
    this.operationList = [];
    this.users = [];
    this.notifyInfo = {};
}

CustomOrder.prototype = new Order();

CustomOrder.prototype._schema = {
    extend: {
        type: 'integer',
        data: 'object'
    }
};

module.exports = CustomOrder;
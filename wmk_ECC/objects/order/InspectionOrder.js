/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var Order = require('./Order');

function InspectionOrder() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.inspectionOrder;

    this.restData = {};
    this.operationList = [];
    this.users = [];
    this.notifyInfo = {};
}

InspectionOrder.prototype = new Order();

InspectionOrder.prototype._schema = {
    extend: {
        guid: 'string',//配置guid
        force_next: 'integer',//是否可以强制转交
        rooms: 'array',//机房数据
        participant: 'array',//参与人员
        mTime: 'datetime'//完成时间
    }
};

module.exports = InspectionOrder;
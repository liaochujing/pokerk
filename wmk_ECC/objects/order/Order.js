/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var NameObject = require('../NameObject');

var db = require('../../db');

function Order() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.order;

    this.id = 0;//工单编号

    this.region = undefined;//作用范围
    this.fullName = '';
    this.name = '';
    this.level = 0;
    this.sponsor = undefined;//发起人
    this.recipient = undefined;//接收人
    this.group = undefined;//所属组
    this.step = 0;//当前步骤
    this.state = 0;//状态
    this.restData = undefined;
    this.operationList = undefined;//操作记录
    this.attachmentList = undefined;//操作记录
    this.sendTime = undefined;//发送时间
    this.receiveTime = undefined;//接收时间
    this.startTime = undefined;//开始时间
    this.createTime = undefined;//创建时间
    this.users = undefined;

    this.notifyInfo = undefined;
}

Order.prototype = new NameObject();

Order.prototype.insert_db = function (callback) {
    var dbOrder = db.order;
    if(!this.createTime){
        this.createTime = new Date();
    }
    this.modifyTime = this.createTime;

    dbOrder.insert_order(this.serverNO, this.classID, this.id, this.region, this.name, this.fullName, this.level, this.sponsor, this.recipient, this.group, this.step, this.state, this.restData, this.operationList, this.users, this.createTime, this.sendTime, this.startTime, callback);
};

Order.prototype.update_db = function (callback) {
    var dbOrder = db.order;
    dbOrder.update_order(this.serverNO, this.classID, this.id, this.region, this.name, this.fullName, this.level, this.sponsor, this.recipient, this.group, this.step, this.state, this.restData, callback);
};

Order.prototype.init_from_row = function (item) {
    this.serverNO = item.serverNO;
    this.classID = item.classID;
    this.id = item.id;
    
    this.region = item.region;
    this.name = item.name;
    this.fullName = item.fullName;
    this.level = item.level;
    this.sponsor = item.sponsor;
    this.recipient = item.recipient;
    this.group = item.group;
    this.step = item.step;
    this.state = item.state;//时间戳
    this.operationList = item.operationList;
    this.attachmentList = item.attachmentList;
    if(item.restData){
        this.restData = item.restData;
    }
    this.users = item.users;
    this.createTime = item.createTime;
    this.sendTime = item.sendTime;
    this.startTime = item.startTime;
    this.receiveTime = item.receiveTime;
    if(item.notifyInfo){
        this.notifyInfo = item.notifyInfo;
    }
};

Order.prototype.load_from_json = function (obj) {
    this.init_from_row(obj);
};

module.exports = Order;
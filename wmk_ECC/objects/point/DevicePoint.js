/**
 * Created by wangxh on 2017/9/20.
 */

'use strict';

var util = require('util');
var uiclassID = require('../../definition/uiClassID');

function DevicePoint() {
    //变量
    //this.serverNO = defaultServerNO;
    //this.classID = uiclassID.devicePoint;
    //this.id = 0;
    // this.fullName = '';
    // this.description = '';

    this.deviceServerNO = defaultServerNO;
    this.deviceClassID = uiclassID.unknown;
    this.deviceID = 0;
    this.pointIndex = 0;//点索引

    this.binding = undefined;//绑定的采集设备点
    // this.pointType = 0;//点类型:AI/AO/DI/DO
    // this.unit = '';//单位
    // this.precision = 0;//精度
    // this.config = {};//配置
    // this.option = {};//附件参数
    // this.pointValue = undefined;
    // this.pointValueTime = def.defaultDate;
}

DevicePoint.prototype.init_from_row = function (item) {
    var self = this;

    if(item.serverNO != undefined){
        self.serverNO = item.serverNO;    
    }
    if(item.classID != undefined) {
        self.classID = item.classID;
    }
    if(item.id != undefined) {
        self.id = item.id;
    }
    if(item.fullName != undefined){
        self.fullName = item.fullName;   
    }
    if(item.description != undefined){
        self.description = item.description;
    }

    self.deviceServerNO = item.deviceServerNO;
    self.deviceClassID = item.deviceClassID;
    self.deviceID = item.deviceID;
    self.pointIndex = item.pointIndex;

    self.binding = item.binding;
    if(item.pointType != undefined){
        self.pointType = item.pointType;
    }
    if(item.unit != undefined){
        self.unit = item.unit;
    }
    if(item.restData){
        self.parse_rest_data(item.restData);
    }
    
    if(item.config){
        self.config = item.config;
    }else{
        self.config = {};
    }
    if(item.option){
        self.option = item.option;
    }
};

DevicePoint.prototype.parse_rest_data = function (restData) {

};

module.exports = DevicePoint;
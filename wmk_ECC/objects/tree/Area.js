/**
 * Created by wangxh on 2017/7/19.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var NameObject = require('../NameObject');

var base = NameObject.prototype;

function Area() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.area;
}

Area.prototype = new NameObject();

Area.prototype._schema = {
    base: base._schema,
    extend: {
        //基本配置
        // children: 'object',//子对象计算能耗使用

        //容量配置
        // ratedPower: 'number',//设计功率
        // ratedColdPower: 'number',//制冷设计功率
        // unitColdPower: 'number',//每套制冷设计功率
        // ratedITPower: 'number',//设计IT功率
        // spec: 'number',//规格(设计机柜数量)
        //
        // cpRatio: 'number',//制冷容量系数
        // mdPoint: 'object',//制冷模式点
        // ucPoint: 'object',//制冷单元数量点
        // entry: 'array',//市电进线

        //能耗配置
        // copPoints: 'object',//cop计算点
        points: 'object',//监控点

        waterUsePoints: 'object',//用水量
        powerUsePoints: 'object',//用电量

        projectID: 'string', //小区编号
        address: 'object',//位置 {longitude: 123, latitude: 123}
        homePage: 'number', //是否进入主页 0不进 1 进
    }
};


module.exports = Area;
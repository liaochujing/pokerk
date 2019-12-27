/**
 * Created by wangxh on 2017/10/23.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var NameObject = require('../NameObject');

var base = NameObject.prototype;

function Building() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.building;
}

Building.prototype = new NameObject();

Building.prototype._schema = {
    base: base._schema,
    extend: {
        //项目配置
        // coverSize: 'number',//占地面积
        // buildSize: 'number',//建筑面积
        // ratedFrame: 'number',//设计机架总数
        // designInput: 'number',//市电总容量
        // designCold: 'number',//制冷总容量
        // designCaifa: 'number',//柴发总容量

        //容量配置
        // ratedPower: 'number',//设计功率
        // ratedColdPower: 'number',//制冷设计功率
        // unitColdPower: 'number',//每套制冷设计功率
        // ratedITPower: 'number',//设计IT功率
        // spec: 'number',//规格(设计机柜数量)
        // cpRatio: 'number',//制冷容量系数
        // mdPoint: 'object',//制冷模式点
        // ucPoint: 'object',//制冷单元数量点
        // entry: 'array',//市电进线

        //能耗配置
        // copPoints: 'object',//cop计算点
        points: 'object',//监控点

        //服务通讯配置
        host: 'string',         //IP地址
        port: 'integer',     //数据端口
    }
};

module.exports = Building;
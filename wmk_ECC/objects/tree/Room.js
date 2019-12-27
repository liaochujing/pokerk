/**
 * Created by wangxh on 2017/10/23.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var NameObject = require('../NameObject');

var base = NameObject.prototype;

function Room() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.room;
}

Room.prototype = new NameObject();

Room.prototype._schema = {
    base: base._schema,
    extend: {
        //基本配置
        rmType: 'number',//机房类型
        position: 'object',//位置
        system: 'string',//所属系统

        //容量配置
        // ratedPower: 'number',
        // ratedITPower: 'number',//设计IT功率
        // ratedColdPower: 'number',//制冷设计功率
        // spec: 'number',//规格(设计机柜数量)
        // cpRatio: 'number',//制冷容量系数
        // acPoint: 'object',//开机空调数量
        statePoint: 'object',//小区状态点

        //能耗配置
        points: 'object'//容量计算配置，能耗数据通过机房内机柜相加计算
    }
};

module.exports = Room;
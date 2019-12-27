/**
 * Created by wangxh on 2017/10/17.
 */

'use strict';

var def = require('../../definition/constants');
var uiclassID = require('../../definition/uiClassID');
var OperatorObject = require('./OperatorObject');

var db = require('../../db/index');

function OperatorGroup() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.operatorGroup;

    // this.id = 0;
    // this.fullName = '';
    // this.description = '';
    // this.restData = {};
    // this.modifyTime = def.defaultDate;
    // this.createTime = def.defaultDate;
}

OperatorGroup.prototype = new OperatorObject();

OperatorGroup.prototype._schema = {
    extend: {
        privilegeList: 'array',//权限列表
        managerScope: 'array',//管理范围

        leader: 'object',//组长
        director: 'object',//主管
        inspector: 'object',//总监

        community: 'integer',//社区
        useType: 'integer',//使用类型
    }
};

module.exports = OperatorGroup;
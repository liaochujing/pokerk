/**
 * Created by wangxh on 2017/10/17.
 */

'use strict';

var def = require('../../definition/constants');
var uiclassID = require('../../definition/uiClassID');
var OperatorObject = require('./OperatorObject');

var base = OperatorObject.prototype;
var db = require('../../db/index');

function Operator() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.operator;
    // this.id = 0;
    // this.account = '';
    // this.password = '';
    // this.fullName = '';
    // this.description = '';
    // this.department = '';//部门
    // this.position = 0;//岗位
    // this.contact = {//联系方式
    //     tel: {type: 'string'},//联系电话
    //     dd: {type: 'string'},//钉钉
    //     qq: {type: 'string'},//qq
    //     email: {type: 'string'},//邮箱
    //     wechat: {type: 'string'}
    // };
    // this.state = 0;
    //
    // this.expired = def.defaultDate;
    // this.pwdExpired = def.defaultDate;
    //
    // this.modifyTime = def.defaultDate;
    // this.createTime = def.defaultDate;
}

Operator.prototype = new OperatorObject();

Operator.prototype._schema = {
    extend: {
        account: 'string',//账号
        password: 'string',//密码
        department: 'string',//部门
        position: 'integer',//岗位
        address: 'string',//地址
        idcard: 'string',//身份证
        contact: 'object',//联系方式{tel: '', dd: '', qq: '', email: '', wechat: ''}
        state: 'integer',//状态
        expired: 'datetime',//过期时间
        pwdExpired: 'datetime',//密码过期时间
        notifyDays: 'integer',//密码过期提醒天数
        checkPwdExpired: 'integer',//是否检查密码过期
        community: 'integer',//社区
        communities: 'object',//社区
        role: 'object'
    }
};

Operator.prototype.load_from_json = function (jObject) {
    var restData = jObject.restData;

    if(restData){
        if(restData.expired && typeof restData.expired == 'string'){
            restData.expired = new Date(restData.expired);
        }
        if(restData.pwdExpired && typeof restData.pwdExpired == 'string'){
            restData.pwdExpired = new Date(restData.pwdExpired);
        }
    }
    base.load_from_json.call(this, jObject);
};

module.exports = Operator;
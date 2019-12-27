/**
 * Created by wangxh on 2017/10/17.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var Operator = require('./Operator');

function Administrator() {
    //变量
    this.classID = uiclassID.admin;
}

Administrator.prototype = new Operator();

module.exports = Administrator;
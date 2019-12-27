/**
 * Created by wangxh on 2018/1/16.
 */

'use strict';

var Device = require('./Device');
var base = new Device();

module.exports = function (classID) {
    function Template() {
        //变量
        this.serverNO = defaultServerNO;
        this.classID = classID;
    }

    Template.prototype = base;

    return Template;
};
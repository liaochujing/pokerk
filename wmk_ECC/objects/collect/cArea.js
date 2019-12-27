/**
 * Created by wangxh on 2017/11/22.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var cObject = require('./cObject');

function cArea() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.cArea;
}

cArea.prototype = new cObject();

module.exports = cArea;
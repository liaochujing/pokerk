/**
 * Created by wangxh on 2017/10/23.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var NameObject = require('../NameObject');

function RowCabinet() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.rowCabinet;
}

RowCabinet.prototype = new NameObject();

module.exports = RowCabinet;
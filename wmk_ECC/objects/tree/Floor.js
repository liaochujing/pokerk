/**
 * Created by wangxh on 2017/10/23.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var NameObject = require('../NameObject');

function Floor() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.floor;
}

Floor.prototype = new NameObject();

module.exports = Floor;
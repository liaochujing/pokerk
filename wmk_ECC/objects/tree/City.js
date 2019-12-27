/**
 * Created by wangxh on 2017/10/23.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var NameObject = require('../NameObject');

function City() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.city;
}

City.prototype = new NameObject();

module.exports = City;
/**
 * Created by wangxh on 2017/7/19.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var NameObject = require('../NameObject');

var base = NameObject.prototype;

function Park() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.park;
}

Park.prototype = new NameObject();

Park.prototype._schema = {
    base: base._schema,
    extend: {
        //基本配置
        // coverSize: 'number',//占地面积
        // buildSize: 'number',//建筑面积
    }
};

module.exports = Park;
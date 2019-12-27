/**
 * Created by wangxh on 2017/10/23.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var GeneralDevice = require('./GeneralDevice');

function GeneralDoor() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.generalDoor;
}

GeneralDoor.prototype = new GeneralDevice();

GeneralDoor.prototype._schema = {
    extend: {
        channelNO: 'integer',
    }
};

module.exports = GeneralDoor;
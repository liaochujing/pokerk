/**
 * Created by wangxh on 2017/10/23.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var GeneralDevice = require('./GeneralDevice');

function Ipc() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.ipc;
}

Ipc.prototype = new GeneralDevice();

Ipc.prototype._schema = {
    extend: {
        channelNO: 'integer',
    }
};

module.exports = Ipc;
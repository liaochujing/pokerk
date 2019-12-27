/**
 * Created by wangxh on 2017/10/23.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var GeneralDevice = require('./GeneralDevice');

function Nvr() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.nvr;
}

Nvr.prototype = new GeneralDevice();

Nvr.prototype._schema = {
    extend: {
        type: 'integer',//nvr类型
        host: 'string',
        port: 'integer',
        username: 'string',
        password: 'string',
        devNO: 'string'//设备编号
    }
};

module.exports = Nvr;
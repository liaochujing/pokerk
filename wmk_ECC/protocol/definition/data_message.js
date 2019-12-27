/**
 * Created by wangxh on 2017/10/13.
 */

'use strict';

function DataMessage(cmd, params) {
    this.cmd = cmd;
    this.data = params;
}

module.exports = DataMessage;
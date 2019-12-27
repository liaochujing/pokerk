/**
 * Created by wangxh on 2018/7/30.
 */

'use strict';

var cmd = require('../protocol/central/cmd');
var code = require('../protocol/central/code');
var DataMsg = require('../protocol/definition/data_message');
var server_manager = require('../protocol/central/server_manager');

function send_message(mode, recipient, title, content, callback) {
    server_manager.send(new DataMsg(cmd.cen_0x00000010, {mode: mode, recipient: recipient, title: title, content: content}), callback)
}

module.exports.send_message = send_message;
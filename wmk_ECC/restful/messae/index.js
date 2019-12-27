/**
 * Created by wangxh on 2018/4/19.
 */

'use strict';

var server_manager = require('../../protocol/message/server_manager');

function send_message(recipient, title, content, callback) {
    server_manager.send_message(recipient, title, content, callback);
}

function apply_config(config, callback) {
    server_manager.init(config, function (err) {
        callback(err);
    });
}

module.exports.apply_config = apply_config;
module.exports.send_message = send_message;
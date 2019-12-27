/**
 * Created by wangxh on 2018/4/19.
 */

'use strict';

let request = require('request');

var _url = undefined;

function send_message(recipient, title, content, callback) {
    if(_url != undefined){
        request.post(_url, {
            body: {
                title: title,
                phoneList: [recipient],
                content: content
            },
            json: true
        }, function (err, res, body) {
            callback(err, body);
        });
    }else{
        callback({msg: 'config not found'});
    }
}

function apply_config(config, callback) {
    _url = config.url;
    callback();
}

module.exports.apply_config = apply_config;
module.exports.send_message = send_message;
/**
 * Created by wangxh on 2018/1/3.
 */

'use strict';

var logger = require('../../util/log_manager').logger;
var request = require('../../util/request');

var _request = require('request');

var _access_token = undefined;
var _config = undefined;

function get_access_token(callback) {
    var now = Date.now();

    if (_access_token && _access_token.expired > now) {
        callback(null, _access_token.token);
    }else{
        request.get({host: 'oapi.dingtalk.com', url:'/gettoken', security: 1}, {corpid: _config.CorpId, corpsecret: _config.CorpSecret}, function (err, res) {
            if(err) return callback(err);

            var data = res.body;
            if(data.errcode == 0){
                _access_token = {
                    token: data.access_token,
                    expired: now + (data.expires_in - 100) * 1000
                };
                callback(err, data.access_token);
            }else{
                logger.error({msg: 'get token failed', data: data});
                callback({message: data.errmsg});
            }
        })
    }
}

function send_message(recipient, title, content, callback) {
    get_access_token(function (err, token) {
        if(err) return callback(err);
        request.post({host: 'oapi.dingtalk.com', url:'/message/send?access_token=' + token, security: 1}, {touser: recipient, toparty: undefined, agentid: _config.agentid, msgtype: 'markdown', markdown: {
            title: title,
            text: '#### ' + title + '\r\n' + content
        }}, function (err, res) {
            if(err) {
                logger.error({msg: 'send dingding failed', err: err});
                return callback(err);
            }
            
            var data = res.body;
            if(data.errcode == 0){
                logger.info({msg: 'send dingding', resp: data});
                callback();
            }else{
                logger.error({msg: 'send dingding message failed', data: data});
                callback({message: data.errmsg});
            }
        })
    });

    //群通知
    /*request.post({host: 'oapi.dingtalk.com', url: '/robot/send?access_token=cdb5fe3dbb77bbe1d4cd059c6b73a27ee0e69b07c92e9444c4ce5055270e6842', security: 1}, {msgtype: 'markdown', markdown: {
        title: title,
        text: '#### ' + title + ' \n' + content + ' \n@' + recipient
    }, at: {atMobiles: ['' + recipient]}}, function (err) {
       if(err){
           logger.error({msg: 'notify failed', err: err});
       }
    });*/
}

function send_message_robot(recipient, title, content, callback) {
    var data = {
        msgtype: 'markdown',
        markdown: {
            title: title,
            text: '#### ' + title + ' \n' + content
        }, at: {atMobiles: []}
    };

    var option = {
        method: 'post',
        url: recipient,
        body: data,
        json: true,
        headers: {'Content-Type': 'application/json; charset=utf-8'}
    };

    _request(option, function (err, res, body) {
        if(err) {
            logger.error({msg: 'send dingding failed', err: err});
            return callback(err);
        }
        logger.info({msg: 'send dingding', data: body});
        callback();
    });
}

function apply_config(config, callback) {
    _config = config;
    _access_token = undefined;

    callback();
}

module.exports.apply_config = apply_config;
module.exports.send_message = send_message;
module.exports.send_message_robot = send_message_robot;
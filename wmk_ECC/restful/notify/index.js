
'use strict';

var logger = require('../../util/log_manager').logger;
var config = require('../../config/config');
var notice_type = require('../../definition/notice_type');
var request = require('../../util/request');
var email = require('../email');
var dingding = require('../dingding');
var cfgKey = require('../../definition/notify_config_key');
var db = require('../../db');
var rdbCFG = db.ramdb.cfg;

//路由
function get_url_option(type) {
    let url = '/server/v1/send/';

    switch(type){
        case notice_type.email:
            url = url + 'email';
            break;
        case notice_type.message:
            url = url + 'message';
            break;
        case notice_type.dingRobot:
            url = url + 'dingRobot';
            break;
        case notice_type.dingding:
            url = url + 'dingding';
            break;
    }

    let option = {
        host: config.notify.host,
        port: config.notify.port,
        url: url,
        security: 0
    }

    return option;
}


function send_message(recipient, title, content, callback) {
    let data = {
        recipient: recipient,
        title: title,
        content: content
    }

    let option = get_url_option(notice_type.message);

    request.post(option, data, function(err, res) {
        if(err) {
            logger.error({msg: 'send_message failed', err: err});
            return callback(err);
        }
        
        var data = res.body;
        if(data.code == 0){
            logger.info({msg: 'send_message', res: data});
            callback();
        }else{
            logger.error({msg: 'send_message failed', data: data});
            callback({message: data.msg});
        }
    })
}

function send_email(recipient, title, content, callback) {
    var _config = rdbCFG.get_system_config(cfgKey.email);
    if(!_config) return callback({msg: 'email config not found'});

    let data = {
        host: _config.host,
        port: _config.port,
        ssl: _config.ssl,
        user: _config.user,
        pass: _config.pass,
        name: _config.name,
        recipient: recipient,
        title: title,
        content: content
    }

    let option = get_url_option(notice_type.email);

    request.post(option, data, function(err, res) {
        if(err) {
            logger.error({msg: 'send_email failed', err: err});
            return callback(err);
        }
        
        var data = res.body;
        if(data.code == 0){
            logger.info({msg: 'send_email', res: data});
            callback();
        }else{
            logger.error({msg: 'send_email failed', data: data});
            callback({message: data.msg});
        }
    })
}

function send_dingding(recipient, title, content, callback) {
    var _config = rdbCFG.get_system_config(cfgKey.dingding);
    if(!_config) return callback({msg: 'dingding config not found'});

    let data = {
        corpId: _config.CorpId,
        corpSecret: _config.CorpSecret,
        agentId: _config.agentid,
        recipient: recipient,
        title: title,
        content: content
    }

    let option = get_url_option(notice_type.dingding);

    request.post(option, data, function(err, res) {
        if(err) {
            logger.error({msg: 'send_dingding failed', err: err});
            return callback(err);
        }
        
        var data = res.body;
        if(data.code == 0){
            logger.info({msg: 'send_dingding', res: data});
            callback();
        }else{
            logger.error({msg: 'send_dingding failed', data: data});
            callback({message: data.msg});
        }
    })
}

function send_dingRobot(recipient, title, content, callback) {
    let data = {
        recipient: recipient,
        title: title,
        content: content
    }

    let option = get_url_option(notice_type.dingRobot);

    request.post(option, data, function(err, res) {
        if(err) {
            logger.error({msg: 'send_dingRobot failed', err: err});
            return callback(err);
        }
        
        var data = res.body;
        if(data.code == 0){
            logger.info({msg: 'send_dingRobot', res: data});
            callback();
        }else{
            logger.error({msg: 'send_dingRobot failed', data: data});
            callback({message: data.msg});
        }
    })
}


function send(body, type, callback) {
    switch(type){
        case notice_type.dingding:
            send_dingding(body.recipient, body.title, body.content, callback);
            break;
        case notice_type.email:
            send_email(body.recipient, body.title, body.content, callback);
            break;
        case notice_type.message:
            send_message(body.recipient, body.title, body.content, callback);
            break;
        case notice_type.dingRobot:
            send_dingRobot(body.recipient, body.title, body.content, callback);
            break;
        default:
            callback({message: 'unsupport notify mode'});
            break;
    }
}


module.exports.send = send
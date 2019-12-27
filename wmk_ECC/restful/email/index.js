/**
 * Created by wangxh on 2018/4/11.
 */

'use strict';

var nodemailer = require('nodemailer');
var logger = require('../../util/log_manager').logger;

var _smtpTransport = undefined;
var _user = undefined;
var _from = undefined;

function send_message(recipient, title, content, callback) {
    _smtpTransport.sendMail({
        from: _from,
        to: _user + ',' + recipient,
        subject: title,
        html: content
    }, function (err, response) {
        if (err) {
            logger.error({msg: 'send email failed', err: err});
            callback({message: err.message});
            return;
        }
        logger.info({msg: 'send email', resp: response});
        
        callback()
    });
}

function apply_config(config, callback) {
    if(_smtpTransport != undefined){
        _smtpTransport.close();
        _smtpTransport = undefined;
        _from = undefined;
    }

    _smtpTransport = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secureConnection: config.ssl,
        auth: {
            user: config.user,
            pass: config.pass
        }
    });
    _user = config.user;
    if(config.name){
        _from = config.name + '<' + config.user + '>'
    }else{
        _from =  config.user;
    }

    callback();
}

module.exports.apply_config = apply_config;
module.exports.send_message = send_message;
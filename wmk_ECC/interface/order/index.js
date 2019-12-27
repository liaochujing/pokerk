/**
 * Created by wangxh on 2017/3/28.
 */

'use strict';

var util = require('util');
var url = require('url');
var qs = require('querystring');
var st = require('../../util/small_tools');
var jsonSchema = require('json-schema');
var logger = require('../../util/log_manager').logger;
var result_code = require('./code');

var middleware = require('../middleware');

const wmk_msg_handerDic = {};
const wmk_get_msg_handerDic = {};

var register_msg_handler = function (fileName) {
    var wmk_msg_handler = require(fileName);
    if (wmk_msg_handler && wmk_msg_handler.cmd && wmk_msg_handler.handle) {
        wmk_msg_handerDic[wmk_msg_handler.cmd] = wmk_msg_handler;
    }else{
        logger.error('invalid message handler of:' + fileName);
    }
};
var register_get_msg_handler = function (fileName) {
    var wmk_msg_handler = require(fileName);
    if (wmk_msg_handler && wmk_msg_handler.cmd && wmk_msg_handler.handle) {
        wmk_get_msg_handerDic[wmk_msg_handler.cmd] = wmk_msg_handler;
    }else{
        logger.error('invalid message handler of:' + fileName);
    }
};

st.traverseDir(__dirname + '/0x0000_0001/', register_msg_handler);
st.traverseDir(__dirname + '/0x0001_0001/', register_msg_handler);

st.traverseDir(__dirname + '/0x0002_0001/', register_get_msg_handler);

var sendResponse = function (req, res, err, result) {
    var cmd = '';
    var status = undefined;
    var msg = undefined;
    var message = undefined;
    if(req.headers){
        cmd = req.headers['cmd'];
    }
    if(err){
        if(err.status == undefined){
            status = result_code.unknown;
        }else{
            status = err.status
        }
        msg = err.msg || result_code.getText(status);
        message = err.message;

        logger.warn('resp req[cmd: %s, code: %s, msg: %s], time: %d ms', cmd, status, msg, Date.now() - req._startTime);
    }else{
        status = result_code.ok;
        msg = result_code.getText(status);
        logger.info('resp req[cmd: %s, code: %s], time: %d ms', cmd, status, Date.now() - req._startTime);
    }

    var response = {
        code: status,
        msg: msg,
        message: message,
        data: result
    };

    res.send(response);
};

var run_action = function (req, res) {
    var cmd = req.headers.cmd;
    var msg_hander = wmk_msg_handerDic[cmd];

    if (msg_hander != null) {
        middleware.check_privilege(req, res, msg_hander, function (err) {
            if(err) return sendResponse(req, res, err);

            middleware.check_param(req, res, msg_hander, function (err) {
                if(err){
                    sendResponse(req, res, err);
                    return;
                }

                msg_hander.handle(req, res, req.body, function (err, result) {
                    sendResponse(req, res, err, result);
                });
            });
        });
    } else {
        sendResponse(req, res, {status: result_code.not_found});
    }
};
var run_get_action = function (req, res) {
    var arg = url.parse(req.url).query;
    var params = qs.parse(arg);

    var cmd = req.headers.cmd;
    var msg_hander = wmk_get_msg_handerDic[cmd];
    if (msg_hander != null) {

        //参数验证
        if(msg_hander.paramSchema){
            var _res = jsonSchema.validate(req.body, params);
            if(!_res.valid){
                sendResponse(req, res, {status: result_code.param_error, msg: _res.errors});
                return;
            }
        }

        msg_hander.handle(req, res, params, function (err, result) {
            sendResponse(req, res, err, result);
        });
    } else {
        sendResponse(req, res, {status: result_code.not_found});
    }
};

var express = require('express');
var router = express.Router();

router.use('/', function (req, res, next) {
    var head = req.headers;

    if (head == null || head == undefined) {
        sendResponse(req, res, {status: result_code.invalid_request});
        return;
    }

    var cmd = head.cmd;
    if (cmd == undefined) {
        sendResponse(req, res, {status: result_code.invalid_request});
        return;
    }

    res.setHeader('Conente-Type', 'application/json');

    next();
});

// 验证登陆
router.use('/', function (req, res, next) {
    middleware.check_login(req, res, function (err) {
        if(err) {
            sendResponse(req, res, err);
            return;
        }
        next();
    });
});

router.post('/interface', function (req, res, next) {
    run_action(req, res);
});

router.get('/interface', function (req, res, next) {
    run_get_action(req, res);
});

router.use('/', function (req, res, next) {
    sendResponse(req, res, {status: result_code.not_found});
});

module.exports = router;
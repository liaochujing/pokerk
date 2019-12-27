/**
 * Created by wangxh on 2017/10/11.
 */

'use strict';

var util = require('util');
var st = require('../../util/small_tools');
var logger = require('../../util/log_manager').logger;
var result_code = require('./code');

var middleware = require('../middleware');
var OperatorAction = require('../../modules/user/definition/operator_action');

var db = require('../../db');
var dbOPL = db.datadb.opl;

const wmk_msg_handerDic = {};

var register_msg_handler = function (fileName) {
    var wmk_msg_handler = require(fileName);
    if (wmk_msg_handler && wmk_msg_handler.cmd && wmk_msg_handler.handle) {
        wmk_msg_handerDic[wmk_msg_handler.cmd] = wmk_msg_handler;
    }else{
        logger.error('invalid message handler of:' + fileName);
    }
};

st.traverseDir(__dirname + '/0x0000_0001/', register_msg_handler);
st.traverseDir(__dirname + '/0x0001_0001/', register_msg_handler);
st.traverseDir(__dirname + '/0x0002_0001/', register_msg_handler);

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

var express = require('express');
var router = express.Router();

router.use('/', function (req, res, next) {
    res.setHeader('Conente-Type', 'application/json');
    next();
});

router.use('/api/user', require('./router/xh_user'));

router.post('/login', function (req, res, next) {
    var data = req.body;

    var account = data.account;
    var password = data.password;

    var rdbOO = db.ramdb.oo;
    var rdbOOR = db.ramdb.oor;

    var now = new Date();

    if(!account){
        sendResponse(req, res, {status: result_code.account_not_found});
        return;
    }
    var _user = rdbOO.get_operator_by_account(account);
    if(!_user){
        sendResponse(req, res, {status: result_code.account_not_found});
        return;
    }
    let area = null;
    if(_user.community){
        area = db.ramdb.no.get_no_sync(null, null, _user.community);
    }

    if(_user.expired < now){
        sendResponse(req, res, {status: result_code.user_expired});
        return;
    }
    if(_user.password != password){
        sendResponse(req, res, {status: result_code.password_error});
        return;
    }
    if(_user.checkPwdExpired){
        if( _user.pwdExpired < now){
            sendResponse(req, res, {status: result_code.password_expired});
            return;
        }
    }

    var ip = data.ip || req.ip;
    if(ip){
        var matchs = ip.match(/\d+\.\d+\.\d+\.\d+/);
        if(matchs && matchs.length > 0){
            ip = matchs[0]
        }
    }
    var _group = rdbOO.get_operator_group(rdbOOR.get_parent_identity(_user.serverNO, _user.classID, _user.id));
    var user = {
        serverNO: _user.serverNO,
        classID: _user.classID,
        id: _user.id,
        account: _user.account,
        name: _user.fullName,
        ip: ip,
        expired: _user.expired,
        group: {serverNO: _group.serverNO, classID: _group.classID, id: _group.id},
        role: _user.role
    };
    req.session.user = user;

    dbOPL.insert_user_log(OperatorAction.login, user, '登录', undefined, now);

    var data = {
        serverNO: _user.serverNO,
        classID: _user.classID,
        id: _user.id,
        account: _user.account,
        state: _user.state,
        position: _user.position,
        role: _user.role,
        expired: _user.expired,
        checkPwdExpired: _user.checkPwdExpired,
        pwdExpired: _user.pwdExpired,
        notifyDays: _user.notifyDays,
        group: {serverNO: _group.serverNO, classID: _group.classID, id: _group.id}
    };

    if(area){
        data.area_serverNO = area.serverNO;
        data.homePage = area.homePage;
    }
    data.community = _user.community;
    data.communities = _user.communities;
    sendResponse(req, res, null, data);
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

router.post('/logout', function (req, res, next) {
    var user = req.session.user;
    req.session.user = null;

    dbOPL.insert_user_log(OperatorAction.login, user, '注销', undefined, new Date());

    sendResponse(req, res);
});

router.post('/interface', function (req, res, next) {
    run_action(req, res);
});

router.use('/', function (req, res, next) {
    sendResponse(req, res, {status: result_code.not_found});
});

module.exports = router;
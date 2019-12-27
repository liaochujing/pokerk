/**
 * Created by wangxh on 2018/11/28.
 */

'use strict';

var url = require('url');
var qs = require('querystring');
var express = require('express');
var router = express.Router();

var code = require('../code');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var objectHelper = require('../../../objects/object_helper');
var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var OperatorAction = require('../../../modules/user/definition/operator_action');

var ss = require('crypto')

var db = require('../../../db');
var rdbNO = db.ramdb.no;
var dbDP = db.dp;
var dbOPL = db.datadb.opl;

function get_group(callback){
    let _group = undefined;

    var _groups = db.ramdb.oo.get_by_class(uiclassID.operatorGroup);
    if(_groups && _groups.length > 0){
        for(let i=0;i<_groups.length;i++){
            let item = _groups[i];
            if(item.useType == 1){
                _group = item;
                break;
            }
        }
    }
    if(_group){
        return callback(null, _group);
    }
    var _identity = {serverNO: 0, classID: 0, id: 0};
    let _objInfo = {
        serverNO: 0,
        classID: uiclassID.operatorGroup,
        fullName: '兴海人员组',
        description: '',
        restData: {
            useType: 1
        }
    }

    var _object = objectHelper.createNameObject(uiclassID.operatorGroup);
    _object.load_from_json(_objInfo);

    var dbOO = db.oo;
    var dbOOR = db.oor;
    var objID = db.objID;

    var notify = function () {
        db.ramdb.oo.set_oo(_object);
        db.ramdb.oor.add_oor({serverNO: _identity.serverNO, classID: _identity.classID, id: _identity.id, childServerNO: _object.serverNO, childClassID: _object.classID, childID: _object.id});

        dbOO.find_operator_object({serverNO: _object.serverNO, classID: _object.classID, id: _object.id}, {_id: 0}, function (err, results) {
            if(err) {
                logger.error({msg: 'try notify operator object changed failed', obj: _object, err: err});
                return;
            }

            if(results && results.length > 0){
                var object = results[0];
                notifyHelper.send_notify(new NotifyMsg(NotifyType.operator_object_created, {container: _identity, object: object}));
            }

            dbOPL.insert_user_log(OperatorAction.add_user, {}, '创建人员组:' + _object.fullName, _object.gen_json_data(), new Date())
        });
    };
    
    objID.gen_object_id('operator_object', function (err, id) {
        if(err) return callback(err);
        _object.id = id;

        if (_identity) {
            dbOOR.insert_relation(_identity.serverNO, _identity.classID, _identity.id, _object.serverNO, _object.classID, _object.id, function (err) {
                if(err){
                    callback(err);
                    return;
                }
                _object.insert_db(function (err) {
                    if(err){
                        callback(err);
                        return;
                    }

                    notify();

                    callback(null, _object);
                });
            });
        } else {
            _object.insert_db(function (err) {
                if(err){
                    callback(err);
                    return;
                }

                notify();

                callback(null, _object);
            });
        }
    });
};

//获取默认总部管理员组
router.post('/get_group', function (req, res, next) {
    let callback = function(err, data){
        sendResponse(req, res, err, data);
    }

    var body = req.body;
    get_group(function(err, container){
        if(err) return callback(err);
        if(container){
            function get_childs(identity) {
                var result = undefined;
                var childs = db.ramdb.oor.get_child_identity(identity.serverNO, identity.classID, identity.id);
                for(var i=0;i<childs.length;i++){
                    var identity = childs[i];
                    if(identity.classID == uiclassID.operatorGroup){
                        var obj = db.ramdb.oo.get_operator_group(identity);
                        if(obj){
                            if(community != null && obj.community != community){
                                continue;
                            }
                            var item = {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, fullName: obj.fullName, leader: obj.leader, director: obj.director, inspector: obj.inspector};
                            var childItems = get_childs(item);
                            if(childItems && childItems.length > 0){
                                item.children = childItems;
                            }
                            if(!result){
                                result = [];
                            }
                            result.push(item);
                        }
                    }else if(identity.classID == uiclassID.operator){
                        var obj = db.ramdb.oo.get_operator(identity);
                        if(obj){
                            var item = {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, fullName: obj.fullName, position: obj.position, contact: obj.contact, community: obj.community, communities: obj.communities};
                            if(!result){
                                result = [];
                            }
                            result.push(item);
                        }
                    }
                }
                return result;
            }

            container.children = get_childs(container);
        }
        callback(null, container);
    });
});

//添加人员
router.post('/add_user', function (req, res, next) {
    let callback = function(err, data){
        sendResponse(req, res, err, data);
    }
    var body = req.body;
    get_group(function(err, container){
        if(err) return callback(err);

        var _identity = container;
        var _objInfo = body.object;
    
        var account = _objInfo.restData.account;
        var operator = db.ramdb.oo.get_operator_by_account(account);
        if(operator){
            callback({status: code.unknown, msg: '此账号已存在'});
            return;
        }
    
        if(_objInfo.restData){
            if(_objInfo.restData.expired){
                _objInfo.restData.expired = new Date(_objInfo.restData.expired);
            }
            if(_objInfo.restData.pwdExpired){
                _objInfo.restData.pwdExpired = new Date(_objInfo.restData.pwdExpired);
            }
        }
    
        var _object = objectHelper.createNameObject(_objInfo.classID);
        _object.load_from_json(_objInfo);
    
        var dbOO = db.oo;
        var dbOOR = db.oor;
        var objID = db.objID;
    
        var notify = function () {
            db.ramdb.oo.set_oo(_object);
            db.ramdb.oor.add_oor({serverNO: _identity.serverNO, classID: _identity.classID, id: _identity.id, childServerNO: _object.serverNO, childClassID: _object.classID, childID: _object.id});
            
            // notifyHelper.send_notify(new NotifyMsg(NotifyType.operator_object_created, {container: _identity, identity: {serverNO: _object.serverNO, classID: _object.classID, id: _object.id}}));
            dbOO.find_operator_object({serverNO: _object.serverNO, classID: _object.classID, id: _object.id}, {_id: 0}, function (err, results) {
                if(err) {
                    logger.error({msg: 'try notify operator object changed failed', obj: _object, err: err});
                    return;
                }
    
                if(results && results.length > 0){
                    notifyHelper.send_notify(new NotifyMsg(NotifyType.operator_object_created, {container: _identity, object: results[0]}));
                }
                dbOPL.insert_user_log(OperatorAction.add_group, req.user, '添加人员:' + _object.fullName, _object.gen_json_data(), new Date())
            });
        };
        
        objID.gen_object_id('operator_object', function (err, id) {
            if(err) return callback(err);
            _object.id = id;
    
            if (_identity) {
                dbOOR.insert_relation(_identity.serverNO, _identity.classID, _identity.id, _object.serverNO, _object.classID, _object.id, function (err) {
                    if(err){
                        callback(err);
                        return;
                    }
                    _object.insert_db(function (err) {
                        if(err){
                            callback(err);
                            return;
                        }
    
                        notify();
    
                        callback(null, {id: id, time: _object.createTime});
                    });
                });
            } else {
                _object.insert_db(function (err) {
                    if(err){
                        callback(err);
                        return;
                    }
    
                    notify();
    
                    callback(null, {id: id, time: _object.createTime});
                });
            }
        });
    });
});
//更新人员
router.post('/update_user', function (req, res, next) {
    let callback = function(err, data){
        sendResponse(req, res, err, data);
    }
    var body = req.body;
    var rdbOO = db.ramdb.oo;
    var _object = rdbOO.get_operator(body);
    if(_object){
        var account = body.restData.account;
        var operator = rdbOO.get_operator_by_account(account);
        if(operator && (operator.serverNO != _object.serverNO || operator.classID != _object.classID || operator.id != _object.id)){
            callback({status: code.unknown, msg: '账号冲突!'});
            return;
        }

        if(body.restData.expired){
            body.restData.expired = new Date(body.restData.expired);
        }
        if(body.restData.pwdExpired){
            body.restData.pwdExpired = new Date(body.restData.pwdExpired);
        }

        var now = new Date();
        var dbOO = db.oo;

        var setpro = {};
        if(body.fullName != undefined){
            setpro.fullName = body.fullName;
        }
        if(body.description != undefined){
            setpro.description = body.description;
        }
        if(body.restData){
            for(var i in body.restData){
                setpro['restData.' + i] = body.restData[i];
            }
        }
        setpro.modifyTime = now;

        dbOO.update({serverNO: body.serverNO, classID: body.classID, id: body.id}, {$set: setpro}, function (err) {
            if(err) {
                callback({status: code.unknown, err: err});
                return;
            }

            dbOO.find_operator_object({serverNO: _object.serverNO, classID: _object.classID, id: _object.id}, {_id: 0}, function (err, results) {
                if(err) {
                    logger.error({msg: 'try notify operator object changed failed', obj: _object, err: err});
                    return;
                }

                if(results && results.length > 0){
                    var row = results[0];

                    rdbOO.del_oo(_object);
                    _object.load_from_json(row);
                    rdbOO.set_oo(_object);

                    notifyHelper.send_notify(new NotifyMsg(NotifyType.operator_object_modified, {object: row}));
                    dbOPL.insert_user_log(OperatorAction.add_group, req.user, '修改人员:' + _object.fullName, _object.gen_json_data(), new Date())
                }
            });

            callback();
        });
    }else{
        callback({status: code.not_found, msg: 'object not found'});
    }
});
//根据账号获取人员
router.post('/get_user', function (req, res, next) {
    let callback = function(err, data){
        sendResponse(req, res, err, data);
    }
    var body = req.body;
    var account = body.account;
    var rdbOO = db.ramdb.oo;
    var operator = rdbOO.get_operator_by_account(account);

    callback(null, operator);
});
//根据小区编号获取区域
router.post('/get_area', function (req, res, next) {
    let callback = function(err, data){
        sendResponse(req, res, err, data);
    }
    let area = null;
    var body = req.body;
    var pid = body.projectID;
    if(pid){
        var list = rdbNO.get_by_class(uiclassID.area);
        if(list && list.length > 0){
            for(let i=0;i<list.length;i++){
                let item = list[i];
                if(item.projectID == pid){
                    area = item;
                    break;
                }
            }
        }
    }

    callback(null, area);
});
//获取人员角色 根据兴海角色id
router.post('/get_role', function (req, res, next) {
    let callback = function(err, data){
        sendResponse(req, res, err, data);
    }
    let role = {};
    var body = req.body;
    var id = body.id;

    var list = db.ramdb.role.get_all_role();
    if(id && id.length > 0){
        for(let j=0;j<id.length;j++){
            let ids = id[j];
            for(let i=0;i<list.length;i++){
                let item = list[i];
                if(item.option && item.option.data){
                    if(item.option.data.id == ids){
                        role[ids] = item;
                        break;
                    }
                }
            }
        }
    }


    callback(null, role);
});

router.use('/', function (err, req, res, next) {
    sendResponse(req, res, err);
});


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
            status = code.unknown;
        }else{
            status = err.status
        }
        msg = err.msg || code.getText(status);
        message = err.message;

        logger.warn('resp req[cmd: %s, code: %s, msg: %s], time: %d ms', cmd, status, msg, Date.now() - req._startTime);
    }else{
        status = code.ok;
        msg = code.getText(status);
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


module.exports = router;
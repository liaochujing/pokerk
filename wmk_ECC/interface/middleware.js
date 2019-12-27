/**
 * Created by wangxh on 2017/11/24.
 */

'use strict';

var jsonSchema = require('json-schema');
var uiclassID = require('../definition/uiClassID');

var code = require('./code');

var db = require('../db');
var ramdb = db.ramdb;
var rdbOO = db.ramdb.oo;

// var code = {
//     ok: 0,
//     not_login: 1,
//     expired: 2
// };

var check_login = function (req, res, done) {
    var session = req.session;
    if(session && session.user){
        var now = new Date();
        req.user = session.user;
        if(req.user.expired && req.user.expired < now){
            done({status: code.user_expired});//过期
            return;
        }
        done();//成功
    }else{
        done({status: code.not_login});//未登录
    }
};

var check_privilege = function (req, res, handler, done) {
    if (req.user && req.user.group) {
        if (req.user.classID == uiclassID.admin || req.user.group.classID == uiclassID.adminGroup) {
            done();
            return;
        }

        var type_list = req.user.role;//人员角色 id集合
        var privilege_list = [];//权限列表

        //权限配置数据
        var role = ramdb.role;
        var has_privilege = false;//是否有权限

        //找出人员所有权限
        for (var i = 0; i < type_list.length; i++) {
            var posdata = role.get_role_by_id(type_list[i]);
            if (posdata) {
                privilege_list.push(posdata);
            }
        }

        var privilege_point = undefined;//接口权限点

        var check_done = function () {
            if (privilege_point) {
                for (var i = 0; i < privilege_list.length; i++) {
                    var _group = privilege_list[i];
                    if (_group && _group.option && _group.option.privilegeList) {
                        if (_group.option.privilegeList.indexOf(privilege_point) >= 0) {
                            has_privilege = true;
                            break;
                        }
                    }
                }
            } else {
                has_privilege = false;
            }

            if (has_privilege) {
                done();
            } else {
                done({ status: code.has_no_privilege });
            }
        };

        if (handler.privilege != undefined) {
            privilege_point = handler.privilege;
            check_done();
        } else if (handler.get_privilege_point != undefined) {//自定义授权验证
            handler.get_privilege_point(req.body, function (err, privilege) {
                if (err) {
                    return done(err);
                } else {
                    privilege_point = privilege;
                }
                check_done();
            });
        } else {
            done();
        }
    } else {
        done();
    }
};

var check_param = function (req, res, handler, done) {
    if(handler.paramSchema){
        var _res = jsonSchema.validate(req.body, handler.paramSchema);
        if(!_res.valid){
            done({status: code.param_error, message: _res.errors});
            return;
        }
    }
    done();
};

module.exports.check_login = check_login;
module.exports.check_privilege = check_privilege;
module.exports.check_param = check_param;
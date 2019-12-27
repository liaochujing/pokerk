/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var privilegePoint = require('../../../definition/privilege_point');
var positionType = require('../../../definition/position_type');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var OperatorAction = require('../../../modules/user/definition/operator_action');

var db = require('../../../db/index');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
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
}

module.exports.privilege = privilegePoint.modifyOperator;
module.exports.cmd = cmd.usr_0x00000006;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        fullName: {type: 'string'},
        description: {type: 'string'},
        restData: {
            type: 'object',
            properties: {
                account: {type: 'string', required: true},
                password: {type: 'string', required: true},
                address: {type: 'string'},
                idcard: {type: 'string'},
                department: {type: 'string'},
                position: {type: 'number', enum: [positionType.worker, positionType.leader, positionType.director, positionType.inspector]},
                contact: {
                    type: 'object',
                    properties: {
                        tel: {type: 'string'},
                        dd: {type: 'string'},
                        qq: {type: 'string'},
                        email: {type: 'string'},
                        wechat: {type: 'string'}
                    },
                    required: true
                },
                expired: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true},
                pwdExpired: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true},
                notifyDays: {type: 'integer', required: true},
                checkPwdExpired: {type: 'integer', enum: [0, 1], required: true},
                community: {type: 'integer'},
                role: {type: 'array', items: {type: 'number'}}
            },
            required: true
        }
    }
};
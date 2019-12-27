/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var privilegePoint = require('../../../definition/privilege_point');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var objectHelper = require('../../../objects/object_helper');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var OperatorAction = require('../../../modules/user/definition/operator_action');

var db = require('../../../db/index');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var _identity = body.container;
    var _objInfo = body.object;

    var user = req.user;
    var _user = db.ramdb.oo.get_operator_by_id(user.id);
    if(_objInfo.restData){
        if(_user && _user.community){
            if(!_objInfo.restData.community){
                _objInfo.restData.community = _user.community;
            }
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
                var object = results[0];
                notifyHelper.send_notify(new NotifyMsg(NotifyType.operator_object_created, {container: _identity, object: object}));
            }

            dbOPL.insert_user_log(OperatorAction.add_user, req.user, '创建人员组:' + _object.fullName, _object.gen_json_data(), new Date())
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
}

module.exports.privilege = privilegePoint.addOperatorGroup;
module.exports.cmd = cmd.usr_0x00000001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        container: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            },
            required: true
        },
        object: {
            type: 'object',
            properties: {
                serverNO: {
                    type: 'number',
                    required: true
                },
                classID: {
                    type: 'number',
                    required: true
                },
                fullName: {
                    type: 'string',
                    required: true
                },
                description: {type: 'string'},
                restData: {type: 'object'}
            },
            required: true
        }
    }
};
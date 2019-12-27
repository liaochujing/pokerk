/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var OperatorState = require('../../../definition/operator_state');
var OperatorAction = require('../../../modules/user/definition/operator_action');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var user = req.user;

    var dbOO = db.oo;
    var dbOPL = db.datadb.opl;
    var rdbOO = db.ramdb.oo;

    var _operator = rdbOO.get_operator(user);
    if(_operator){
        dbOO.update_state(_operator.serverNO, _operator.classID, _operator.id, OperatorState.onDuty, function (err) {
            if(err) {
                return callback({status: code.unknown});
            }

            _operator.state = OperatorState.onDuty;

            dbOPL.insert_user_log(OperatorAction.onDuty, user, '值班', undefined, new Date());

            dbOO.find_operator_object({serverNO: _operator.serverNO, classID: _operator.classID, id: _operator.id}, {_id: 0}, function (err, results) {
                if(err) {
                    logger.error({msg: 'try notify operator object changed failed', obj: _operator, err: err});
                    return;
                }

                if(results && results.length > 0){
                    var row = results[0];

                    notifyHelper.send_notify(new NotifyMsg(NotifyType.operator_object_modified, {object: row}));
                }
            });

            callback();
        })
    }else{
        callback({status: code.unknown, msg: 'operator not found'});
    }
}

module.exports.cmd = cmd.usr_0x00020001;
module.exports.handle = handle;
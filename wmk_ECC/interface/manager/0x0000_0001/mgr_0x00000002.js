/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var cmd = require('../cmd');
var code = require('../code');

var path = require('path');
var fileType = require('../../../definition/file_type');
var fileHelper = require('../../../util/file_helper');
var action_helper = require('../../../helpers/init_action_helper');
var action_type = action_helper.action_type;
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    fileHelper.closefd(body.reqGuid, function (err) {
        if (err) {
            logger.error('req {reqGuid: %s, type: %d} upload file close fd failed: %s',body.reqGuid, body.type, err.message);
        } else {
            logger.info('req {reqGuid: %s,  type: %d} upload file success',body.reqGuid, body.type);
        }
        callback();

        switch(body.type){
            case fileType.backup:
                dbOPL.insert_user_log(ManagerAction.restore, req.user, '还原数据库', null, new Date());
                action_helper.run_action(action_type.restore, {restart: true}, null, function (err) {
                    if(err){
                        logger.error({msg: 'run restore action failed', err: err});
                    }
                });
                break;
            case fileType.update:
                dbOPL.insert_user_log(ManagerAction.update, req.user, '更新', null, new Date());
                action_helper.run_action(action_type.update, {restart: true}, null, function (err) {
                    if(err){
                        logger.error({msg: 'update service failed', err: err});
                    }
                });
                break;
            case fileType.update_web:
                dbOPL.insert_user_log(ManagerAction.update_web, req.user, '更新前端', null, new Date());
                action_helper.run_action(action_type.update_web, null, null, function (err) {
                    if(err){
                        logger.error({msg: 'update service failed', err: err});
                    }
                });
                break;
            default:
                break;
        }
    });
}

module.exports.cmd = cmd.mgr_0x00000002;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        type: {type: 'number', required: true},
        reqGuid: {type: 'string', required: true}
    }
};
/**
 * Created by wangxh on 2017/7/24.
 */

'use strict';

var _ = require('../../util/global_helper');
var util = require('util');
var ah = require('../../util/array_helper');
var _logger = require('./../../util/log_manager');
var logger = _logger.logger;
var stateLog = _logger.stateLog;
var version = require('./../../config/version');
var config = require('../../config/config');

//启动
function run(param) {
    ah.series([print_run_info, function (cb) {
        init_db(param, cb);
    }, init_central_service, init_modules], function (err) {
        if(err){
            logger.error({msg: 'start service failed', err: err});
            stateLog.error('模块初始化失败:%s', err.msg || err.message);
            process.exit(1);
        }else{
            process.on('uncaughtException', function(err) {
                logger.error(err);
                stateLog.error('模块未知异常:%s', err.message);
                //process.exit(1);
            });

            logger.mark('start energy success');
            stateLog.mark('模块初始化完成');
        }
    });
}

//打印启动信息
function print_run_info(callback) {
    logger.mark('-----------------------------------');
    logger.mark('start energy service version %s', version);
    stateLog.mark('模块启动,版本:%s', version);

    callback();
}

//启动数据库
function init_db(param, callback) {
    var db = require('./../../db/index');
    db.init({db: {}, cache: ['no', 'nor', 'oo', 'oor', 'ast', 'asset', 'pst', 'role', {name: 'cfg', param: {system: svrType}}]}, function (err) {
        if(err){
            callback({msg: 'init db failed', err: err});
        }else{
            callback();
        }
    });
}

//启动中控服务
function init_central_service(callback) {
    var NotifyType = require('../../protocol/central/notify_type');
    var server_manager = require('../../protocol/central/server_manager');
    server_manager.init({host: config.central.host, port: config.central.port}, {host: config.assets.host, port: config.assets.nport, type: svrType, notifies: [
        NotifyType.name_object_created,
        NotifyType.name_object_removed,
        NotifyType.name_object_modified,
        NotifyType.name_object_add_relation,
        NotifyType.name_object_del_relation,

        NotifyType.operator_object_created,
        NotifyType.operator_object_removed,
        NotifyType.operator_object_modified,

        // NotifyType.collect_object_created,
        // NotifyType.collect_object_removed,
        // NotifyType.collect_object_modified,

        NotifyType.asset_created,
        NotifyType.asset_removed,
        NotifyType.asset_modified,

        NotifyType.restart,
        NotifyType.role_deleted,
        NotifyType.role_modified,
        NotifyType.role_created
    ]}, function (err) {
        if(err) return callback(err);
        callback();
    });
}

//启动模块
function init_modules(callback) {

    
    var asset = require('../../modules/asset');
    asset.init(function (err) {
        if(err) return callback(err);
        
        var http = require('../../interface/index');
        http.start(config.assets, callback);
    });
}

module.exports.run = run;
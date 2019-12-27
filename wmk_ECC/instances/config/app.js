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
    }, init_modules], function (err) {
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

            logger.mark('start config success');
            stateLog.mark('模块初始化完成');
        }
    });
}

//打印启动信息
function print_run_info(callback) {
    logger.mark('-----------------------------------');
    logger.mark('start config service version %s', version);
    stateLog.mark('模块启动,版本:%s', version);

    callback();
}

//启动数据库
function init_db(param, callback) {
    var db = require('./../../db/index');
    db.init({db: {}, cache: []}, function (err) {
        if(err){
            callback({msg: 'init db failed', err: err});
        }else{
            callback();
        }
    });
}

//启动模块
function init_modules(callback) {
    var http = require('../../interface');
    http.start(config.config, callback);
}

module.exports.run = run;
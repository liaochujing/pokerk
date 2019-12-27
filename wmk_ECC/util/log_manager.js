/**
 * Created by wangxh on 2017/7/13.
 */

'use strict';

var util = require('util');
var log4js = require('log4js');
var path = require('path');
var path_helper = require('./path_helper');
var serverType = require('../definition/service_type');
var config = require('../config/log_config');

var defaultType = config.default;
var serverTypename = '';
if(svrType != serverType.none){
    serverTypename = serverType.getText(svrType);
}

//检查创建日志目录
for(var i in config.appenders){
    var appender = config.appenders[i];
    if(appender.filename){
        appender.filename = path.join(path_helper.logPath, serverTypename, appender.filename);
        path_helper.ensure_path(path.dirname(appender.filename))
    }
    if(serverTypename && appender.category == defaultType){
        defaultType = serverTypename;
        config.levels[defaultType] = config.levels[appender.category];
        appender.category = defaultType;
    }
}

log4js.configure(config);

var logger = log4js.getLogger(defaultType);
var stateLog = log4js.getLogger('state');

function empty() {
}

if(config.default != 'console'){
    console.log = empty;
}
console.show = function () {
    logger.mark.apply(logger, arguments);
};

var levels = {
    trace: 0,
    debug : 1,
    info : 2,
    warn : 3,
    error : 4,
    fatal : 5,
    mark : 6
};

for(var i in config.appenders){
    var appender = config.appenders[i];
    var category = appender.category;
    var tempLoger =  log4js.getLogger(category);

    var strLevel = (config.levels[category] || 'info').toLocaleLowerCase();
    var valueLevel = levels[strLevel] || 2;

    for(var key in levels){
        var value = levels[key];
        if(value < valueLevel){
            tempLoger[key] = empty;
        }
    }
}

exports.logger = logger;
exports.stateLog = stateLog;
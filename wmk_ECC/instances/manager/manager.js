/**
 * Created by wangxh on 2017/9/27.
 */

'use strict';

var running_mode = require('../../definition/running_mode');
var serverType = require('../../definition/service_type');
var param = {};

global.svrType = serverType.manager;
global.defaultServerNO = 0;
var args = process.argv.splice(2);
if(args[0]){
    var config = JSON.parse(args[0]);
    global.running_mode = config.mode;
}else{
    global.running_mode = running_mode.normal;
}


var app = require('./app');
app.run(param);
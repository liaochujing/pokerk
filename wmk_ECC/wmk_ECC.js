
'use strict';

var util = require('util');
var cluster = require('cluster');
var _running_mode = require('./definition/running_mode');

var workerParams = {};

global.svrType = 0;
global.defaultServerNO = 0;
var args = process.argv.splice(2);
if(args[0]){
    var config = JSON.parse(args[0]);
    global.running_mode = config.mode;
}else{
    global.running_mode = _running_mode.normal;
}

if(cluster.isMaster){
    let param = {mode: running_mode};
    run_init_action(function () {
        //人员管理
        run_user(param);
        //告警服务
        run_alarm(param);
        //容量管理服务
        run_capacity(param);
        //能耗管理服务
        run_energy(param);
        //资产管理服务
        run_asset(param);
        //工单
        run_order(param);
        //配置管理服务
        run_manager(param);
        //报表服务
        run_intersvr(param);
        //配置服务
        run_config(param);
    });

    cluster.on('exit', function(worker) {
        if(worker && workerParams[worker.id]){
            var param = workerParams[worker.id];
            delete workerParams[worker.id];
            cluster.setupMaster(param);
            var worker = cluster.fork();
            if(worker){
                workerParams[worker.id] = param;
            }
        }
    });
}

process.on( 'SIGTERM', function() {
    for( var id in cluster.workers ) {
        process.kill( id );
    }
    process.exit(0);
});

//检查执行操作
function run_init_action(done) {
    var init_action = require('./helpers/init_action_helper');
    init_action.check_run_action(done);
}

function run_user(param) {
    var param = {
        exec: './instances/user/user.js',
        args:  [format_param(param)],
        //silent: false
    };
    cluster.setupMaster(param);
    var worker = cluster.fork();
    if(worker){
        workerParams[worker.id] = param;
    }
}

function run_manager(param) {
    var param = {
        exec: './instances/manager/manager.js',
        args:  [format_param(param)],
        //silent: false
    };
    cluster.setupMaster(param);
    var worker = cluster.fork();
    if(worker){
        workerParams[worker.id] = param;
    }
}

function run_alarm(param) {
    var param = {
        exec: './instances/alarm/alarm.js',
        args:  [format_param(param)],
        //silent: false
    };
    cluster.setupMaster(param);
    var worker = cluster.fork();
    if(worker){
        workerParams[worker.id] = param;
    }
}

function run_intersvr(param) {
    var param = {
        exec: './instances/intersvr/intersvr.js',
        args: [format_param(param)],
        //silent: false
    };
    cluster.setupMaster(param);
    var worker = cluster.fork();
    if(worker){
        workerParams[worker.id] = param;
    }
}

function run_capacity(param) {
    var param = {
        exec: './instances/capacity/capacity.js',
        args: [format_param(param)],
        //silent: false
    };
    cluster.setupMaster(param);
    var worker = cluster.fork();
    if(worker){
        workerParams[worker.id] = param;
    }
}

function run_energy(param) {
    var param = {
        exec: './instances/energy/energy.js',
        args: [format_param(param)],
        //silent: false
    };
    cluster.setupMaster(param);
    var worker = cluster.fork();
    if(worker){
        workerParams[worker.id] = param;
    }
}

function run_asset(param) {
    var param = {
        exec: './instances/asset/asset.js',
        args: [format_param(param)],
        //silent: false
    };
    cluster.setupMaster(param);
    var worker = cluster.fork();
    if(worker){
        workerParams[worker.id] = param;
    }
}

function run_order(param) {
    var param = {
        exec: './instances/order/order.js',
        args: [format_param(param)],
        //silent: false
    };
    cluster.setupMaster(param);
    var worker = cluster.fork();
    if(worker){
        workerParams[worker.id] = param;
    }
}

function run_config(param) {
    var param = {
        exec: './instances/config/config.js',
        args: [format_param(param)],
        //silent: false
    };
    cluster.setupMaster(param);
    var worker = cluster.fork();
    if(worker){
        workerParams[worker.id] = param;
    }
}

function format_param(param) {
    if(param){
        return JSON.stringify(param).replace('\ \g', '')
    }else{
        return '';
    }
}
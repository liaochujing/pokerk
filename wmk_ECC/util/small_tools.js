/**
 * Created by wangxh on 2017/10/25.
 */

'use strict';

var util = require('util');
var fs = require('fs');
var path = require('path');
var ah = require('./array_helper');
var logger = require('./log_manager').logger;
var path_helper = require('./path_helper');
var exec = require('child_process').exec;

function padLeft(str) {
    var ret;

    ret = str.toString();
    if (ret.length == 1) {
        ret = '0' + ret;
    }

    return ret;
}

Date.now_unix = function () {
    return Math.floor(this.now() / 1000);
};

Date.from_unix = function (time) {
    return new Date(time * 1000);
};

Date.prototype.to_unix = function () {
    return Math.floor(this.getTime() / 1000);
};

Date.prototype.format_year = function () {
    return '' + this.getFullYear()
};

Date.prototype.format_month = function (sperator) {
    if(!sperator){
        sperator = '';
    }
    return this.getFullYear() + sperator + padLeft(this.getMonth() + 1);
};

Date.prototype.format_day = function (sperator) {
    if(!sperator){
        sperator = '';
    }
    return this.getFullYear() + sperator + padLeft(this.getMonth() + 1) + sperator + padLeft(this.getDate());
};

Date.prototype.format_hour = function () {
    return this.getFullYear() + '-' + padLeft(this.getMonth() + 1) + '-' + padLeft(this.getDate()) + ' ' + padLeft(this.getHours()) + ':00:00';
};

Date.prototype.format_minute = function () {
    return this.getFullYear() + '-' + padLeft(this.getMonth() + 1) + '-' + padLeft(this.getDate()) + ' ' + padLeft(this.getHours()) + ':' + padLeft(this.getMinutes()) + ':00';
};

Date.prototype.format_datetime = function () {
    return this.getFullYear() + '-' + padLeft(this.getMonth() + 1) + '-' + padLeft(this.getDate()) + ' ' + padLeft(this.getHours()) + ':' + padLeft(this.getMinutes()) + ':' + padLeft(this.getSeconds());
};

Date.prototype.format_minute_without_year = function () {
    return padLeft(this.getMonth() + 1) + '-' + padLeft(this.getDate()) + ' ' + padLeft(this.getHours()) + ':' + padLeft(this.getMinutes());
};

Date.prototype.AddMinutes = function (minute) {
    var _t = this.getTime() + minute * 60000;
    return new Date(_t)
};

Date.prototype.AddHours = function (hours) {
    var _t = this.getTime() + hours * 3600000;
    return new Date(_t)
};

Date.prototype.AddDays = function (days) {
    var _t = this.getTime() + days * 24 * 3600000;
    return new Date(_t)
};

Date.prototype.AddMonth = function (months) {
    var _d = new Date(this);
    _d.setMonth(_d.getMonth() + months);
    return  _d;
};

Date.prototype.AddYear = function (years) {
    var _d = new Date(this);
    _d.setYear(_d.getFullYear() + years);
    return  _d;
};

Date.prototype.GetDate = function () {
    var _d = new Date(this);
    _d.setHours(0);
    _d.setMinutes(0);
    _d.setSeconds(0);
    _d.setMilliseconds(0);
    return  _d;
};

Date.prototype.GetMonth = function () {
    var _d = this.GetDate();
    _d.setDate(1);
    return  _d;
};

Date.prototype.GetYear = function () {
    var _d = this.GetMonth();
    _d.setMonth(0);
    return _d;
};


function executeShell(cmd, callback) {
    if (!callback) {
        return;
    }
    if (!cmd) {
        callback('cmd empty.', null);
        return;
    }
    exec(cmd, function (err, stdout, stderr) {
        if (err) {
            callback(err, null);
        } else {
            callback(undefined, stdout);
        }
    });
}

function traverseDir(dir, fileCallback) {
    var fileList = fs.readdirSync(dir, 'utf-8');

    for (var i = 0; i < fileList.length; i++) {
        var target = path.join(dir, fileList[i]);
        var stat = fs.lstatSync(target);
        if (stat.isDirectory()) {
            traverseDir(target, fileCallback);
        } else {
            try{
                if(fileCallback){
                    fileCallback(target);
                }
            }catch(err){
                logger.error(err);
            }
        }
    }
}

/**
 * 重启服务(抛出异常,然后由pm2重启)
 * @param restart_reason
 */
function restart_service(restart_reason, immediately) {
    if(immediately){
        logger.error(util.format('%s - restarting service, reason %s', new Date().toLocaleString(), restart_reason));
        process.exit(0);
    }else{
        setTimeout(function () {
            logger.error(util.format('%s - restarting service, reason %s', new Date().toLocaleString(), restart_reason));
            process.exit(0);
        }, 300);
    }
}

function rmdir(dir) {
    function iterator(url,dirs){
        var stat = fs.statSync(url);
        if(stat.isDirectory()){
            dirs.unshift(url);//收集目录
            inner(url,dirs);
        }else if(stat.isFile()){
            fs.unlinkSync(url);//直接删除文件
        }
    }
    function inner(path,dirs){
        var arr = fs.readdirSync(path);
        for(var i = 0, el ; el = arr[i++];){
            iterator(path+"/"+el,dirs);
        }
    }

    var dirs = [];
    try{
        iterator(dir,dirs);
        for(var i = 0, el ; el = dirs[i++];){
            fs.rmdirSync(el);//一次性删除所有收集到的目录
        }
    }catch(e){//如果文件或目录本来就不存在，fs.statSync会报错，不过我们还是当成没有异常发生
        logger.error(e);
    }
}

function cleardir(dir) {
    rmdir(dir);
    path_helper.ensure_path(dir);
}

function pad_left(n, length) {
    var str = '' + n;
    for(var i=1;i<length;i++){
        str = str[i] ? str : '0' + str;
    }
    return str;
}

function unique_array(arr) {
    var result = [], hash = {};
    for (var i = 0, elem; (elem = arr[i]) != null; i++) {
        if (!hash[elem]) {
            result.push(elem);
            hash[elem] = true;
        }
    }
    return result;
}

var small_tools = module.exports;
small_tools.executeShell = executeShell;
small_tools.traverseDir = traverseDir;
small_tools.pad_left = pad_left;
small_tools.unique_array = unique_array;
small_tools.rmdir = rmdir;
small_tools.cleardir = cleardir;
small_tools.restart_service = restart_service;
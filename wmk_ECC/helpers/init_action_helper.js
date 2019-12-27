/**
 * Created by wangxh on 2017/6/28.
 */

'use strict';

var fs = require('fs');
var util = require('util');
var path = require('path');
var config_helper = require('./../util/config_helper');
var path_helper = require('./../util/path_helper');
var logger = require('../util/log_manager').logger;
var st = require('../util/small_tools');

var config = require('../config/config');
var dbManager = require('../db/db_manager');

const action_file = path.join(path_helper.cachePath, 'action_cache.json');

var action_type = {
    init: 0,//初始化
    backup: 1,//备份数据
    restore: 2,//还原数据
    update: 3,//更新升级
    update_web: 4//升级前端
};

function init(param, done) {
    done();
}

function backup(param, done) {
    var target_path = path.join(path_helper.cachePath, 'backup.tar.gz');
    if(fs.existsSync(target_path)){
        fs.unlinkSync(target_path);
    }
    var dir_path = path.join(path_helper.cachePath, 'backup');
    if(fs.existsSync(dir_path)){
        st.rmdir(dir_path);
    }
    fs.mkdirSync(dir_path);

    dbManager.backup(dir_path, param, function (err) {
        if(err) return done(err);
        var cmd = util.format('cd %s && tar -czf backup.tar.gz ./backup', path_helper.cachePath);
        st.executeShell(cmd, function (err) {
            if(err){
                logger.error(err);
            }
            done(err);
        })
    })
}

function restore(param, done) {
    var target_path = path.join(path_helper.cachePath, 'backup.tar.gz');
    if(!fs.existsSync(target_path)){
        return done(new Error('backup gz file not found'));
    }
    var dir_path = path.join(path_helper.cachePath, 'backup');
    if(fs.existsSync(dir_path)){
        st.rmdir(dir_path);
    }
    var source_path = path.join(dir_path, 'deviceconfig');
    var cmd = util.format('cd %s && tar -xzvf backup.tar.gz', path_helper.cachePath);
    st.executeShell(cmd, function (err) {
        if(err) return done(err);
        dbManager.restore(dir_path, param, function (err) {
            if(err) return done(err);
            st.executeShell('node update', function (err) {
                if(err) logger.error('update db failed', err);
                done();
            })
        });
    })
}

function update(param, done) {
    var target_path = path.join(path_helper.cachePath, 'update.tar.gz');
    fs.exists(target_path, function (exists){
        if(exists){
            var tar_cmd = util.format('tar -zxvf %s -C %s && node update', target_path, path_helper.rootPath);
            st.executeShell(tar_cmd, function (err) {
                if(err) logger.error('update service tar failed', err);
                done();
            })
        }else {
            done(new Error('update package not found'));
        }
    });
}

function update_web(param, done) {
    var target_path = path.join(path_helper.cachePath, 'update_web.tar.gz');
    fs.exists(target_path, function (exists){
        if(exists){
            var dirname = path.dirname(path_helper.webPath);
            var tar_cmd = util.format('tar -zxvf %s -C %s', target_path, dirname);
            st.executeShell(tar_cmd, function (err) {
                if(err) logger.error('update web tar failed', err);
                st.executeShell(util.format('%s restart %s', config.pm || 'pm2', config.web), function (err) {
                    done(err);
                })
            })
        }else {
            done(new Error('update package not found'));
        }
    });
}

function check_run_action(done) {
    read_action(function (err, action) {
        if(err) return done(err);
        
        var run_done = function (err) {
            delete_action(function () {
                if(action && action.option && action.option.restart){
                    if(err){
                        logger.error({msg: 'run action failed', err: err});
                    }
                    logger.error(util.format('%s - restarting service, reason %s', new Date().toLocaleString(), 'perform offline action finish, need restart'));
                    st.executeShell(util.format('%s restart %s ecc', config.pm || 'pm2', config.main), function (err) {
                        if(err) logger.error({msg: 'exec restart cmd failed', err: err})
                    });
                }else{
                    done(err);
                }
            });
        };

        if(action){
            switch (action.type){
                case action_type.init:
                    init(action.param, run_done);
                    break;
                case action_type.backup:
                    backup(action.param, run_done);
                    break;
                case action_type.restore:
                    restore(action.param, run_done);
                    break;
                case action_type.update:
                    update(action.param, run_done);
                    break;
                case action_type.update_web:
                    update_web(action.param, run_done);
                    break;
                default:
                    logger.error('unknown restart action: ', action.type);
                    run_done();
                    break;
            }
        }else{
            run_done();
        }
    })
}

function run_action(type, opt, param, done) {
    switch(type){
        case action_type.backup:
            backup(param, done);
            break;
        default:
            var action = {type: type, option: opt, param: param};
            save_action(action, function (err) {
                if(err) return done(err);
                logger.error(util.format('%s - restarting service, reason %s', new Date().toLocaleString(), 'prepare perform offline action.'));
                st.executeShell(util.format('%s restart %s ecc', config.pm || 'pm2', config.main), function (err) {
                    if(err) logger.error({msg: 'exec restart cmd failed', err: err});
                    done(err);
                });
            });
            break;
    }
}

function save_action(action, callback) {
    config_helper.write_config(action_file, action, function (err) {
        if (err) {
            logger.error('save action cache failed, reason %s', err.message);
        }
        if(callback){
            callback(err);
        }
    });
}

function read_action(callback) {
    config_helper.read_config(action_file, function (err, cfg) {
        if (err) {
            logger.error('read action cache failed, reason %s', err.message);
        }
        if(callback){
            callback(err, cfg);
        }
    });
}

function delete_action(callback) {
    config_helper.delete_config(action_file, function (err) {
        if (err) {
            logger.error('delete action cache failed, reason %s', err.message);
        }
        if(callback){
            callback(err);
        }
    });
}

module.exports.action_type = action_type;
module.exports.check_run_action = check_run_action;
module.exports.run_action = run_action;
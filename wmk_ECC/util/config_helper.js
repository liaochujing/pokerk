/**
 * Created by wangxh on 2017/7/19.
 */

'use strict';

var util = require('util');
var fs = require('fs');
var logger = require('./log_manager').logger;
var st = require('./small_tools');

function exists_config(config_path, callback) {
    fs.exists(config_path, function (exists){
        callback(null, exists);
    });
}

function read_config(config_path, callback) {
    if (!callback) {
        return;
    }

    fs.open(config_path, 'r', function (err, fd) {
        if (err) {
            if (err.code === "ENOENT") {
                // console.error('myfile does not exist');
                callback(undefined, null);
            } else {
                callback(err);
            }

            return;
        }

        fs.readFile(fd, 'utf8', function (err, data) {
            if (err) {
                callback(err);
                return;
            }

            fs.close(fd, function () {
                var read_err;
                var config;
                try{
                    config = JSON.parse(data);
                }catch(err){
                    read_err = err;
                }

                callback(read_err, config);
            });
        });
    });
}

function write_config (config_path, json, callback) {
    delete_config(config_path, function (del_error) {
        if (del_error) {
            logger.error('delete config failed while write config, reason %s', config_path, del_error.message);
            if (callback) {
                callback(del_error);
            }
            return;
        }

        fs.open(config_path, 'wx', function (err, fd) {
            if (err) {
                logger.error('open config failed while write config, reason %s', config_path, err.message);
                if (callback) {
                    callback(err);
                }
                return;
            }

            var jsonStr = JSON.stringify(json);
            fs.writeFile(fd, jsonStr, 'utf8', function (err) {
                if (err) {
                    if (callback) {
                        callback(err);
                    }
                    return;
                }

                fs.close(fd, function () {
                    callback();
                });
            });
        });
    });
}

function delete_config(config_path, callback) {
    exists_config(config_path, function (check_error, result) {
        if (check_error) {
            if (callback) {
                callback(check_error);
            }
            return;
        }

        if (result) {
            fs.unlink(config_path, function (err) {
                if (err) {
                    if (callback) {
                        callback(err);
                    }
                    return;
                }

                callback();
            });
        }
        else {
            callback();
        }
    });
}

module.exports.exists_config = exists_config;
module.exports.read_config = read_config;
module.exports.write_config = write_config;
module.exports.delete_config = delete_config;
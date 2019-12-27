/**
 * Created by wangxh on 2017/7/19.
 */

'use strict';

var util = require('util');
var fs = require('fs');
var logger = require('./log_manager').logger;
var st = require('./small_tools');

function file_helper() {
    var self = this;

    self.fd_overTime = 60 * 1000; //文件描述符的过期间隔(1分钟)
    self.clear_fd_interval = 60 * 1000; //定期清理过期文件描述符间隔(1分钟)
    self.fd_map = {}; //文件描述符字典
}

/**
 * 获取文件描述符
 * @param fdKey
 * @param path
 * @param flags
 * @param mode
 * @param callback
 */
file_helper.prototype.getfd = function (fdKey, path, flags, mode, callback) {
    var self = this;

    if (!callback) {
        return;
    }

    var dtNow = Date.now();
    var fd_info = self.fd_map[fdKey];
    if (fd_info == undefined) {
        fs.open(path, flags, mode, function (err, fd_open) {
            if (err) {
                logger.error('open file{fdKey: %s, path: %s}failed:%s', fdKey, path, err.message);
                callback(err);
                return;
            }

            fs.fstat(fd_open, function (state_err, stats) {
                if (state_err) {
                    logger.error('open file{fdKey: %s, path: %s}get length failed:%s', fdKey, path, state_err.message);
                    callback(err);
                    return;
                }

                fd_info = {
                    fd: fd_open,
                    size: stats.size,
                    lastAccessTime: dtNow
                };

                self.fd_map[fdKey] = fd_info;
                callback(undefined, fd_info);
            });
        });
        return;
    }
    else {
        fd_info.lastAccessTime = dtNow;
    }

    callback(undefined, fd_info);
};

/**
 * 清除已过期的文件描述符
 */
file_helper.prototype.clear_timeoverfd = function () {
    var self = this;
    
    setInterval(function () {
        var dtNow = new Date();
        var removingfdKeyArray = [];

        for (var key in self.fd_map) {
            if (self.fd_map.hasOwnProperty(key)) {
                var keyStr = key.toString();
                var fd_info = self.fd_map[keyStr];
                if (fd_info) {
                    var time_span = fd_info.lastAccessTime - dtNow;
                    if (time_span >= self.fd_overTime) {
                        removingfdKeyArray.push(keyStr);
                    }
                }
            }
        }

        for (var i = 0; i < removingfdKeyArray.length; i++) {
            var fdKey = removingfdKeyArray[i];
            delete self.fd_map[fdKey];

            logger.info('time over {fd: %s} has been deleted', fdKey);
        }
    }, self.clear_fd_interval);
};

/**
 * 关闭文件描述符
 * @param fdKey
 * @param callback
 */
file_helper.prototype.closefd = function (fdKey, callback) {
    var self = this;

    var fd_info = self.fd_map[fdKey];
    if (fd_info != undefined) {
        delete self.fd_map[fdKey];
        fs.close(fd_info.fd, function (err) {
            if (err) {
                logger.error('close file {fdKey: %s} failed:%s', fdKey, err.message);
                callback(err);
                return;
            }

            callback();
        });
        return;
    }

    if (callback) {
        callback();
    }
};

/**
 * 写文件数据
 * @param fdKey
 * @param path
 * @param offset
 * @param data
 * @param callback
 */
file_helper.prototype.writeFileData = function (fdKey, path, offset, data, callback) {
    var self = this;
    self.getfd(fdKey, path, 'w', undefined, function (get_error, fd_info) {
        if (get_error) {
            logger.error('write file get file {fdKey: %s, path: %s}desd failed:%s', fdKey, path, get_error.message);
            callback(get_error);
            return;
        }

        if (offset < 0
            || !(data instanceof Buffer)) {
            logger.error('write file {fdKey: %s, path: %s}, off set {reqOffset: %d} invalid', fdKey, path, offset);
            callback(undefined, {
                size: fd_info.size,
                offset: 0
            });
            return;
        }

        fs.write(fd_info.fd, data, 0, data.length, offset, function (err, bytesWritten, buffer) {
            if (err) {
                logger.error('write file {fdKey: %s, path: %s} failed:%s', fdKey, path, err.message);
                callback(err);
                return;
            }

            callback(undefined, {
                size: fd_info.size,
                offset: offset + bytesWritten
            });
        });
    });
};

/**
 * 读文件数据
 * @param fdKey
 * @param path
 * @param offset
 * @param dataLength
 * @param callback
 */
file_helper.prototype.readFileData = function (fdKey, path, offset, dataLength, callback) {
    var self = this;

    self.getfd(fdKey, path, 'r', undefined, function (get_error, fd_info) {
        if (get_error) {
            logger.error('reqd file{fdKey: %s, path: %s} get fd failed %s', fdKey, path, get_error.message);
            callback(get_error);
            return;
        }

        if (offset < 0
            || offset >= fd_info.size) {
            logger.error('read file {fdKey: %s, path: %s} fd offset {reqOffset: %d, fileLength: %d}invalid', fdKey, path, offset, fd_info.size);
            callback(undefined, {
                size: fd_info.size,
                offset: 0,
                data: new Buffer(0)
            });
            return;
        }

        var bufferLength = dataLength;

        if (offset + dataLength > fd_info.size) {
            bufferLength = fd_info.size - offset;
        }

        var readBuffer = new Buffer(bufferLength);

        fs.read(fd_info.fd, readBuffer, 0, readBuffer.length, offset, function (err, bytesRead, buffer) {
            if (err) {
                logger.error('read file{fdKey: %s, path: %s}fd error:%s', fdKey, path, err.message);
                callback(err);
                return;
            }

            callback(undefined, {
                size: fd_info.size,
                offset: offset,
                data: buffer
            });
        });
    });
};

if (!(!!file_helper.singleInstance)) { //如果没设置单实例,则创建单实例
    /**
     *
     * @type {file_helper}
     */
    file_helper.singleInstance = new file_helper();

    file_helper.singleInstance.clear_timeoverfd();
}

/**
 *
 * @type {nameObjectIDManager}.singleInstance
 */
module.exports = file_helper.singleInstance;
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var path = require('path');
var fileType = require('../../../definition/file_type');
var fileHelper = require('../../../util/file_helper');
var pathHelper = require('../../../util/path_helper');

function handle(req, res, body, callback) {
    var filePath = undefined;
    switch(body.type){
        case fileType.backup:
            filePath = path.join(pathHelper.cachePath, 'backup.tar.gz');
            break;
        case fileType.update:
            filePath = path.join(pathHelper.cachePath, 'update.tar.gz');
            break;
        case fileType.update_web:
            filePath = path.join(pathHelper.cachePath, 'update_web.tar.gz');
            break;
        default:
            callback({status: code.unknown, msg: '未知文件类型'});
            return;
            break;
    }

    var data = Buffer.from(body.content, 'base64');
    if (!(data instanceof Buffer)) {
        callback({status: code.unknown, msg: '数据错误'});
        return;
    }
    fileHelper.writeFileData(body.reqGuid, filePath, body.offset, data, function (err, info) {
        if (err) {
            callback({status: code.unknown, msg: '写数据错误'});
            return;
        }

        var result = {
            reqGuid: body.reqGuid, //请求的唯一标识
            reqOrder: body.reqOrder, //请求的包序号(可用于校验是否丢包, 从1开始)
            offsetWritten: info.offset //已写入的偏移
        };

        callback(null, result);
    });
}

module.exports.cmd = cmd.mgr_0x00000001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        type: {type: 'number', required: true},
        reqGuid: {type: 'string', required: true},
        reqOrder: {type: 'string', required: true},
        offset: {type: 'number', required: true},
        content: {type: 'string', required: true}
    }
};
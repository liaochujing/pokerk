/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var path = require('path');
var fileType = require('../../../definition/file_type');
var pathHelper = require('../../../util/path_helper');
var fileHelper = require('../../../util/file_helper');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var action_helper = require('../../../helpers/init_action_helper');
var action_type = action_helper.action_type;

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {

    function prepare(done) {
        if(body.offset != 0){
            done();
            return;
        }
        switch(body.type){
            case fileType.backup:
                var option = body.option;
                var _alarm = 0;
                if(option){
                    _alarm = option.alarm || 0;
                }

                dbOPL.insert_user_log(ManagerAction.backup, req.user, '备份数据库', null, new Date());
                action_helper.run_action(action_type.backup, null, {alarm: _alarm}, function (err) {
                    done(err);
                });
                return;
            default:
                done();
                return;
        }
    }

    prepare(function (err) {
        if(err) return callback(err);

        var filePath = undefined;
        switch(body.type){
            case fileType.backup:
                filePath = path.join(pathHelper.cachePath, 'backup.tar.gz');
                break;
            default:
                callback({status: code.unknown, msg: '未知文件类型'});
                return;
                break;
        }

        var fileName = path.basename(filePath);
        fileHelper.readFileData(body.reqGuid, filePath, body.offset, body.length, function (read_err, info) {
            if (read_err) {
                callback({status: code.unknown, msg: '读取文件错误'});
                return;
            }

            var result = {
                reqGuid: body.reqGuid, //请求的唯一标识
                reqOrder: body.reqOrder, //请求的包序号(可用于校验是否丢包, 从1开始)
                length: info.size, //文件总长度(单位:字节)
                offset: info.offset, //文件请求偏移
                content: info.data.toString('base64'), //base64编码的内容(内容的最大长度4K)
                fileName: fileName // 下载的文件名
            };

            callback(null, result);
        });
    });
}

module.exports.cmd = cmd.mgr_0x00000003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        type: {type: 'number', required: true},
        reqGuid: {type: 'string', required: true},
        reqOrder: {type: 'string', required: true},
        length: {type: 'number', required: true},
        offset: {type: 'number', required: true}
    }
};
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var fileHelper = require('../../../util/file_helper');

function handle(req, res, body, callback) {
    fileHelper.closefd(body.reqGuid, function (err) {
        if (err) {
            logger.error('req {reqGuid: %s} close fd failed: %s', body.reqGuid, err.message);
        }
        callback();
    });
}

module.exports.cmd = cmd.mgr_0x00000004;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        reqGuid: {type: 'string', required: true}
    }
};
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbConfigFile = db.cfgFile;

function handle(req, res, body, callback) {
    dbConfigFile.insert_config_file(body.name, body.path, body.content, new Date(), callback)
}

module.exports.cmd = cmd.cfg_0x00000001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        name: {type: 'string', required: true},
        path: {type: 'string', required: true},
        content: {type: 'string', required: true}
    }
};
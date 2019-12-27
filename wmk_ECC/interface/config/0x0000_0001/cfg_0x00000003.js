/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbConfigFile = db.cfgFile;

function handle(req, res, body, callback) {
    dbConfigFile.get_config_file(body.name, function (err, result) {
        if (err) return callback(err);
        if (result) {
            callback(null, {
                name: result._id,
                path: result.path,
                content: result.content,
                time: result.time
            })
        } else {
            callback();
        }
    });
}

module.exports.cmd = cmd.cfg_0x00000003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        name: {type: 'string', required: true}
    }
};
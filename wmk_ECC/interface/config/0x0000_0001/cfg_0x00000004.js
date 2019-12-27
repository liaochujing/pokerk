/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbConfigFile = db.cfgFile;

function handle(req, res, body, callback) {
    dbConfigFile.find_config_file({}, {_id: 1, time: 1}, function (err, results) {
        if(err) return callback();
        var res = [];
        if(results){
            for(var i=0;i<results.length;i++){
                var _item = results[i];
                res.push({name: _item._id, time: _item.time})
            }
        }
        callback(null, res);
    })
}

module.exports.cmd = cmd.cfg_0x00000004;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        name: {type: 'string'}
    }
};
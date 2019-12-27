/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbDEP = db.dep;
    dbDEP.find_device_type({}, {_id: 0, system: 1, systemName: 1, group: 1, groupName: 1, id: 1, name: 1, desc: 1, 'config.classID': 1}, function (err, result) {
        if(err) return callback(err);
        callback(null, result);
    });
}

module.exports.cmd = cmd.mgr_0x00010009;
module.exports.handle = handle;
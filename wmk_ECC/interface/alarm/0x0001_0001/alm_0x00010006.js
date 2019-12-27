/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbALP = db.alp;

    dbALP.find_alarm_type({}, {id: 1, name: 1, 'option.priority': 1}, function (err, results) {
        if(err) return callback(err);
        var res = [];

        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                res.push({id: item.id, name: item.name, priority: item.option.priority})
            }
        }

        callback(null, res);
    });
}

module.exports.cmd = cmd.alm_0x00010006;
module.exports.handle = handle;
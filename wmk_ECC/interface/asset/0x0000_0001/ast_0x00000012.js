/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var attribute = db.attribute;

    attribute.find_attribute({}, {}, function (err, results) {
        if(err) return callback({status: code.unknown});

        var result = [];
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                result.push({id: item._id, name: item.name});
            }
        }

        callback(null, result);
    })
}

module.exports.privilege = PrivilegePoint.queryAsset;
module.exports.cmd = cmd.ast_0x00000012;
module.exports.handle = handle;
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var path = require('path');
var cmd = require('../cmd');
var code = require('../code');
var PrivilegePoint = require('../../../definition/privilege_point');

var db = require('../../../db/index');
var dbAttachment = db.attachment;

function handle(req, res, body, callback) {
    var user = req.user;
    var role = db.ramdb.role;
    let result = [];
    var config = role.get_all_role();

    if(body.type != null){
        if(config && config.length > 0){
            for(let i=0;i<config.length;i++){
                let item = config[i];
                if(item.type == body.type){
                    result.push(item);
                }
            }
        }
    }else{
        result = config;
    }

    callback(null, result)
}

module.exports.privilege = PrivilegePoint.queryRole;
module.exports.cmd = cmd.usr_0x00000013;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        type: {type: 'number'}
    }
};

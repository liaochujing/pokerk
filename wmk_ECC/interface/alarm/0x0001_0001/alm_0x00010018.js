/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var sysConfigKey = require('../../../modules/alarm/definition/system_config_key');
var db = require('../../../db');
var privilegePoint = require('../../../definition/privilege_point');

function handle(req, res, body, callback) {
    let community = undefined;//人员所属社区id
    var user = req.user;
    if(!body.community){
        var _user = db.ramdb.oo.get_by_identity(user);
        if(_user){
            community = _user.community;
        }
    }else{
        community = body.community;
    }


    let result = null;

    var config = db.ramdb.cfg.get_system_config(sysConfigKey.alarm_notify_rule_config);
    if(config && config.length > 0){
        for(let i=0;i<config.length;i++){
            let item = config[i];
            if(community != null && community == item.community){
                result = item;
                break;
            }else if(community == null && item.community == null){
                result = item;
                break;
            }
        }
    }

    // var dbAAC = db.areaAlarmConfig;
    // dbAAC.find_area_alarm_config({id: body.community}, {},function (err, results) {
    //     if (err) return callback(err);
    //     var res = undefined;
    //     if (results && results.length > 0) {
    //         res = results[0]['alarm_notify_rule_config'];
    //     }
    //     callback(null, res);
    // })
    callback(null, result);
}

module.exports.privilege = privilegePoint.getAlarmNotify;
module.exports.cmd = cmd.alm_0x00010018;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        community: {type: 'integer'}
    }             
};
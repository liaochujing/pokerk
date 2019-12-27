/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var PointType = require('../../../definition/point_type');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbDP = db.dp;

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

    dbDP.find_device_point({'config.alarm.convergence': {$exists: true}}, {deviceServerNO: 1, deviceClassID: 1, deviceID: 1, pointIndex: 1, fullName: 1, 'config.alarm': 1}, function (err, results) {
        if(err) return callback(err);
        var response = [];

        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                if(community != null){
                    let area_identity = db.ramdb.nor.get_parent_identity(item.deviceServerNO, item.deviceClassID, item.deviceID, uiclassID.area);
                    if(area_identity){
                        let area_no = db.ramdb.no.get_by_identity(area_identity);
                        if(area_no != null && area_no.id != community){
                            continue;
                        }
                    }
                }
                let list = [];
                if(item.config.alarm && item.config.alarm.length > 0) {
                    for(let j=0;j<item.config.alarm.length;j++){
                        let _item = item.config.alarm[j];
                        if(_item.convergence){
                            list.push(_item.convergence);
                        }
                    }
                }

                response.push({
                    serverNO: item.deviceServerNO,
                    classID: item.deviceClassID,
                    id: item.deviceID,
                    pointIndex: item.pointIndex,
                    name: item.fullName,
                    convergence: list
                })
            }
        }

        callback(null, response);
    });
}

module.exports.privilege = PrivilegePoint.getAlarmShield;
module.exports.cmd = cmd.alm_0x00010008;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        community: {type: 'integer'}
    }             
};
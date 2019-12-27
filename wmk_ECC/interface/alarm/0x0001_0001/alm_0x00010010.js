/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;

var PrivilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db');

function handle(req, res, body, callback) {
    var response = [];

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

    var devices = db.ramdb.no.get_by_class_rang(uiclassID.device, uiclassID.lastDevice);
    if(devices && devices.length > 0){
        for(var i=0;i<devices.length;i++){
            var device = devices[i];

            if(community != null){
                let area_identity = db.ramdb.nor.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.area);
                if(area_identity){
                    let area_no = db.ramdb.no.get_by_identity(area_identity);
                    if(area_no != null && area_no.id != community){
                        continue;
                    }
                }
            }

            if(device.shield && device.shield.enabled){
                response.push({
                    serverNO: device.serverNO,
                    classID: device.classID,
                    id: device.id,
                    name: device.fullName,
                    shield: device.shield
                })
            }
        }
    }

    callback(null, response);
}

module.exports.privilege = PrivilegePoint.getAlarmConvergence;
module.exports.cmd = cmd.alm_0x00010010;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        community: {type: 'integer'}
    }             
};
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var response = [];

    var dic = {};
    var devices = areaHelper.get_child_identity_range(body.serverNO, body.classID, body.id, uiclassID.device, uiclassID.lastDevice);
    if(devices && devices.length > 0){
        for(var i = 0;i<devices.length;i++){
            var device = ramdb.no.get_by_identity(devices[i]);
            if(device){
                var template = ramdb.dep.get_device_type(device.type);
                if(template){
                    var key = format_key(template.system, template.group);
                    if(!dic[key]){
                        dic[key] = {
                            name: template.groupName,
                            count: 0
                        }
                    }
                    dic[key].count++;
                }
            }
        }
    }

    for(var i in dic){
        var item = dic[i];
        response.push({
            name: item.name,
            value: item.count
        })
    }

    callback(null, response);
}

module.exports.cmd = cmd.cmd_0x0000203A;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
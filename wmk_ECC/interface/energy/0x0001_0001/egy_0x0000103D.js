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

var EnergySystem = require('../../../modules/energy/definition/energy_system');
var PowerSystem = require('../../../modules/energy/definition/power_system');
var DefinitionHelper = require('../../../modules/energy/definition/definition_helper');

var areaHelper = require('../../../helpers/area_helper');
var deviceHelper = require('../../../helpers/device_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = [];

    var dic = {};
    var deviceList = areaHelper.get_child_identity_range(body.serverNO, body.classID, body.id, uiclassID.device, uiclassID.lastDevice);
    for(var i in deviceList){
        var device = ramdb.no.get_by_identity(deviceList[i]);
        var _config = deviceHelper.get_device_type_config(device);
        if(_config && _config.esType){
            var esType = _config.esType;
            if(esType.system == EnergySystem.power){
                if(dic[esType.group]){
                    dic[esType.group]++;
                }else{
                    dic[esType.group] = 1;
                }
            }
        }
    }

    for(var i in PowerSystem){
        var group = PowerSystem[i];

        response.push({
            name: DefinitionHelper.get_power_system_name(group),
            value: dic[group] || 0
        })
    }

    callback(null, response);
}

module.exports.cmd = cmd.cmd_0x0000103D;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
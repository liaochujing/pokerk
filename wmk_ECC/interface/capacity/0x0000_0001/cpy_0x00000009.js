/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var serverHelper = require('../../../protocol/central/interface_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var identity = body;
    var deviceClassID = body.deviceClassID;
    var building = ramdb.no.get_by_identity(identity);
    if(building){
        var deviceIdentitys = ramdb.nor.get_child_identity_list(building.serverNO, building.classID, building.id, deviceClassID);

        var response = [];
        ah.each(deviceIdentitys, function (_identity, cbItem) {
            var device = ramdb.no.get_by_identity(_identity);
            if(device){
                var points = [];

                var item = undefined;
                var _type = ramdb.dep.get_device_type(device.type);
                if (_type && _type.config) {
                    item = _type.config.mPoints;
                }

                if(item){
                    if(item.cold){
                        if(item.cold.points){
                            points = points.concat(item.cold.points)
                        }
                        if(item.cold.exclude){
                            points = points.concat(item.cold.exclude)
                        }
                    }
                    if(item.power){
                        if(item.power.points){
                            points = points.concat(item.power.points)
                        }
                        if(item.power.exclude){
                            points = points.concat(item.power.exclude)
                        }
                    }
                }

                if(points.length > 0){
                    var _pointDic = {};
                    _pointDic[device.id] = points;
                    serverHelper.get_point_value(identity.serverNO, _pointDic, function (err, data) {
                        if(err) logger.error(err);

                        var resItem = {
                            name: device.fullName,
                            power: {
                                rated: device.ratedColdPower || 0,
                                used: 0
                            },
                            cold: {
                                rated: device.ratedCold || 0,
                                used: 0
                            }
                        };

                        response.push(resItem);

                        var deviceID = device.id;
                        if(data){
                            var cold = 0;
                            if(item.cold){
                                if(item.cold.points){
                                    for(var i in item.cold.points){
                                        var _p = item.cold.points[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            cold+=data[deviceID][_p];
                                        }
                                    }
                                }
                                if(item.cold.exclude){
                                    for(var i in item.cold.exclude){
                                        var _p = item.cold.exclude[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            cold-=data[deviceID][_p];
                                        }
                                    }
                                }
                            }
                            resItem.cold.used = format_value(cold);

                            var power = 0;
                            if(item.power){
                                if(item.power.points){
                                    for(var i in item.power.points){
                                        var _p = item.power.points[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            power+=data[deviceID][_p];
                                        }
                                    }
                                }
                                if(item.power.exclude){
                                    for(var i in item.power.exclude){
                                        var _p = item.power.exclude[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            power-=data[deviceID][_p];
                                        }
                                    }
                                }
                            }
                            resItem.power.used = format_value(power);
                        }

                        cbItem();
                    })
                }else{
                    var resItem = {
                        name: device.fullName,
                        power: {
                            rated: device.ratedColdPower || 0,
                            used: 0
                        },
                        cold: {
                            rated: device.ratedCold || 0,
                            used: 0
                        }
                    };

                    response.push(resItem);

                    cbItem();
                }
            }else{
                cbItem();
            }
        }, function () {
            callback(null, response);
        });
    }else{
        callback({status: code.not_found, msg: 'building not found'});
    }
}

module.exports.cmd = cmd.cpy_0x00000009;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        deviceClassID: {
            type: 'array',
            items: {
                type: 'number'
            },
            required: true
        }
    }
};
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
                    if(item.out_power){
                        if(item.out_power.points){
                            points = points.concat(item.out_power.points)
                        }
                        if(item.out_power.exclude){
                            points = points.concat(item.out_power.exclude)
                        }
                    }

                    if(item.out_elec){
                        if(item.out_elec.points){
                            points = points.concat(item.out_elec.points)
                        }
                        if(item.out_elec.exclude){
                            points = points.concat(item.out_elec.exclude)
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
                            ratedPower: device.ratedPower || 0,
                            ratedElec: device.ratedElec || 0,
                            power: 0,
                            elec: 0
                        };

                        response.push(resItem);

                        var deviceID = device.id;
                        if(data){
                            var out_power = 0;
                            if(item.out_power){
                                if(item.out_power.points){
                                    for(var i in item.out_power.points){
                                        var _p = item.out_power.points[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_power+=data[deviceID][_p];
                                        }
                                    }
                                }
                                if(item.out_power.exclude){
                                    for(var i in item.out_power.exclude){
                                        var _p = item.out_power.exclude[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_power-=data[deviceID][_p];
                                        }
                                    }
                                }
                            }
                            resItem.power = format_value(out_power);


                            var out_elec = 0;
                            if(item.out_elec){
                                if(item.out_elec.points){
                                    for(var i in item.out_elec.points){
                                        var _p = item.out_elec.points[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_elec+=data[deviceID][_p];
                                        }
                                    }
                                }
                                if(item.out_elec.exclude){
                                    for(var i in item.out_elec.exclude){
                                        var _p = item.out_elec.exclude[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_elec-=data[deviceID][_p];
                                        }
                                    }
                                }
                            }
                            resItem.elec = format_value(out_elec);
                        }

                        cbItem();
                    })
                }else{
                    var resItem = {
                        name: device.fullName,
                        ratedPower: device.ratedPower || 0,
                        ratedElec: device.ratedElec || 0,
                        power: 0,
                        elec: 0
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

module.exports.cmd = cmd.cpy_0x00000007;
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
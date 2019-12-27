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
                    if(item.out_power_a){
                        if(item.out_power_a.points){
                            points = points.concat(item.out_power_a.points)
                        }
                        if(item.out_power_a.exclude){
                            points = points.concat(item.out_power_a.exclude)
                        }
                    }
                    if(item.out_power_b){
                        if(item.out_power_b.points){
                            points = points.concat(item.out_power_b.points)
                        }
                        if(item.out_power_b.exclude){
                            points = points.concat(item.out_power_b.exclude)
                        }
                    }
                    if(item.out_power_c){
                        if(item.out_power_c.points){
                            points = points.concat(item.out_power_c.points)
                        }
                        if(item.out_power_c.exclude){
                            points = points.concat(item.out_power_c.exclude)
                        }
                    }

                    if(item.out_elec_a){
                        if(item.out_elec_a.points){
                            points = points.concat(item.out_elec_a.points)
                        }
                        if(item.out_elec_a.exclude){
                            points = points.concat(item.out_elec_a.exclude)
                        }
                    }
                    if(item.out_elec_b){
                        if(item.out_elec_b.points){
                            points = points.concat(item.out_elec_b.points)
                        }
                        if(item.out_elec_b.exclude){
                            points = points.concat(item.out_elec_b.exclude)
                        }
                    }
                    if(item.out_elec_c){
                        if(item.out_elec_c.points){
                            points = points.concat(item.out_elec_c.points)
                        }
                        if(item.out_elec_c.exclude){
                            points = points.concat(item.out_elec_c.exclude)
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
                            power: {
                                a: 0,
                                b: 0,
                                c: 0
                            },
                            elec: {
                                a: 0,
                                b: 0,
                                c: 0
                            }
                        };

                        response.push(resItem);

                        var deviceID = device.id;
                        if(data){
                            var out_power_a = 0;
                            if(item.out_power_a){
                                if(item.out_power_a.points){
                                    for(var i in item.out_power_a.points){
                                        var _p = item.out_power_a.points[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_power_a+=data[deviceID][_p];
                                        }
                                    }
                                }
                                if(item.out_power_a.exclude){
                                    for(var i in item.out_power_a.exclude){
                                        var _p = item.out_power_a.exclude[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_power_a-=data[deviceID][_p];
                                        }
                                    }
                                }
                            }
                            resItem.power.a = format_value(out_power_a);

                            var out_power_b = 0;
                            if(item.out_power_b){
                                if(item.out_power_b.points){
                                    for(var i in item.out_power_b.points){
                                        var _p = item.out_power_b.points[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_power_b+=data[deviceID][_p];
                                        }
                                    }
                                }
                                if(item.out_power_b.exclude){
                                    for(var i in item.out_power_b.exclude){
                                        var _p = item.out_power_b.exclude[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_power_b-=data[deviceID][_p];
                                        }
                                    }
                                }
                            }
                            resItem.power.b = format_value(out_power_b);

                            var out_power_c = 0;
                            if(item.out_power_c){
                                if(item.out_power_c.points){
                                    for(var i in item.out_power_c.points){
                                        var _p = item.out_power_c.points[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_power_c+=data[deviceID][_p];
                                        }
                                    }
                                }
                                if(item.out_power_c.exclude){
                                    for(var i in item.out_power_c.exclude){
                                        var _p = item.out_power_c.exclude[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_power_c-=data[deviceID][_p];
                                        }
                                    }
                                }
                            }
                            resItem.power.c = format_value(out_power_c);

                            var out_elec_a = 0;
                            if(item.out_elec_a){
                                if(item.out_elec_a.points){
                                    for(var i in item.out_elec_a.points){
                                        var _p = item.out_elec_a.points[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_elec_a+=data[deviceID][_p];
                                        }
                                    }
                                }
                                if(item.out_elec_a.exclude){
                                    for(var i in item.out_elec_a.exclude){
                                        var _p = item.out_elec_a.exclude[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_elec_a-=data[deviceID][_p];
                                        }
                                    }
                                }
                            }
                            resItem.elec.a = format_value(out_elec_a);

                            var out_elec_b = 0;
                            if(item.out_elec_b){
                                if(item.out_elec_b.points){
                                    for(var i in item.out_elec_b.points){
                                        var _p = item.out_elec_b.points[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_elec_b+=data[deviceID][_p];
                                        }
                                    }
                                }
                                if(item.out_elec_b.exclude){
                                    for(var i in item.out_elec_b.exclude){
                                        var _p = item.out_elec_b.exclude[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_elec_b-=data[deviceID][_p];
                                        }
                                    }
                                }
                            }
                            resItem.elec.b = format_value(out_elec_b);

                            var out_elec_c = 0;
                            if(item.out_elec_c){
                                if(item.out_elec_c.points){
                                    for(var i in item.out_elec_c.points){
                                        var _p = item.out_elec_c.points[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_elec_c+=data[deviceID][_p];
                                        }
                                    }
                                }
                                if(item.out_elec_c.exclude){
                                    for(var i in item.out_elec_c.exclude){
                                        var _p = item.out_elec_c.exclude[i];
                                        if(data[deviceID] && data[deviceID][_p]){
                                            out_elec_c-=data[deviceID][_p];
                                        }
                                    }
                                }
                            }
                            resItem.elec.c = format_value(out_elec_c);
                        }

                        cbItem();
                    })
                }else{
                    var resItem = {
                        name: device.fullName,
                        ratedPower: device.ratedPower || 0,
                        ratedElec: device.ratedElec || 0,
                        power: {
                            a: 0,
                            b: 0,
                            c: 0
                        },
                        elec: {
                            a: 0,
                            b: 0,
                            c: 0
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

module.exports.cmd = cmd.cpy_0x00000006;
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
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var db = require('../../../db/index');
var ramdb = db.ramdb;

var serverHelper = require('../../../protocol/central/interface_helper');
var realTimeProcessor = require('../../../modules/capacity/processor/real_time_data_processor');

function handle(req, res, body, callback) {
    var building = ramdb.no.get_by_identity(body);
    if(building){
        var response = [];

        var format_data = function (data) {
            if(building.entry && building.entry.length > 0){
                var entry = [];
                for(var j=0;j<building.entry.length;j++){
                    var item = building.entry[j];

                    var resItem = {
                        name: item.name,
                        ratedPower: item.ratedPower || 0,
                        ratedOutPower: item.ratedOutPower || 0,
                        power: {
                            a: 0,
                            b: 0,
                            c: 0
                        },
                        out_power: {
                            a: 0,
                            b: 0,
                            c: 0
                        }
                    };

                    if(data){
                        var power_a = 0;
                        if(item.power_a){
                            if(item.power_a.points){
                                for(var i in item.power_a.points){
                                    var _p = item.power_a.points[i];
                                    if(data[_p.serverNO] && data[_p.serverNO][_p.id] && data[_p.serverNO][_p.id][_p.pointIndex]){
                                        power_a+=data[_p.serverNO][_p.id][_p.pointIndex];
                                    }
                                }
                            }
                            if(item.power_a.exclude){
                                for(var i in item.power_a.exclude){
                                    var _p = item.power_a.exclude[i];
                                    if(data[_p.serverNO] && data[_p.serverNO][_p.id] && data[_p.serverNO][_p.id][_p.pointIndex]){
                                        power_a-=data[_p.serverNO][_p.id][_p.pointIndex];
                                    }
                                }
                            }
                        }
                        resItem.power.a = format_value(power_a);

                        var power_b = 0;
                        if(item.power_b){
                            if(item.power_b.points){
                                for(var i in item.power_b.points){
                                    var _p = item.power_b.points[i];
                                    if(data[_p.serverNO] && data[_p.serverNO][_p.id] && data[_p.serverNO][_p.id][_p.pointIndex]){
                                        power_b+=data[_p.serverNO][_p.id][_p.pointIndex];
                                    }
                                }
                            }
                            if(item.power_b.exclude){
                                for(var i in item.power_b.exclude){
                                    var _p = item.power_b.exclude[i];
                                    if(data[_p.serverNO] && data[_p.serverNO][_p.id] && data[_p.serverNO][_p.id][_p.pointIndex]){
                                        power_b-=data[_p.serverNO][_p.id][_p.pointIndex];
                                    }
                                }
                            }
                        }
                        resItem.power.b = format_value(power_b);

                        var power_c = 0;
                        if(item.power_c){
                            if(item.power_c.points){
                                for(var i in item.power_c.points){
                                    var _p = item.power_c.points[i];
                                    if(data[_p.serverNO] && data[_p.serverNO][_p.id] && data[_p.serverNO][_p.id][_p.pointIndex]){
                                        power_c+=data[_p.serverNO][_p.id][_p.pointIndex];
                                    }
                                }
                            }
                            if(item.power_c.exclude){
                                for(var i in item.power_c.exclude){
                                    var _p = item.power_c.exclude[i];
                                    if(data[_p.serverNO] && data[_p.serverNO][_p.id] && data[_p.serverNO][_p.id][_p.pointIndex]){
                                        power_c-=data[_p.serverNO][_p.id][_p.pointIndex];
                                    }
                                }
                            }
                        }
                        resItem.power.c = format_value(power_c);

                        var out_power_a = 0;
                        if(item.out_power_a){
                            if(item.out_power_a.points){
                                for(var i in item.out_power_a.points){
                                    var _p = item.out_power_a.points[i];
                                    if(data[_p.serverNO] && data[_p.serverNO][_p.id] && data[_p.serverNO][_p.id][_p.pointIndex]){
                                        out_power_a+=data[_p.serverNO][_p.id][_p.pointIndex];
                                    }
                                }
                            }
                            if(item.out_power_a.exclude){
                                for(var i in item.out_power_a.exclude){
                                    var _p = item.out_power_a.exclude[i];
                                    if(data[_p.serverNO] && data[_p.serverNO][_p.id] && data[_p.serverNO][_p.id][_p.pointIndex]){
                                        out_power_a-=data[_p.serverNO][_p.id][_p.pointIndex];
                                    }
                                }
                            }
                        }
                        resItem.out_power.a = format_value(out_power_a);

                        var out_power_b = 0;
                        if(item.out_power_b){
                            if(item.out_power_b.points){
                                for(var i in item.out_power_b.points){
                                    var _p = item.out_power_b.points[i];
                                    if(data[_p.serverNO] && data[_p.serverNO][_p.id] && data[_p.serverNO][_p.id][_p.pointIndex]){
                                        out_power_b+=data[_p.serverNO][_p.id][_p.pointIndex];
                                    }
                                }
                            }
                            if(item.out_power_b.exclude){
                                for(var i in item.out_power_b.exclude){
                                    var _p = item.out_power_b.exclude[i];
                                    if(data[_p.serverNO] && data[_p.serverNO][_p.id] && data[_p.serverNO][_p.id][_p.pointIndex]){
                                        out_power_b-=data[_p.serverNO][_p.id][_p.pointIndex];
                                    }
                                }
                            }
                        }
                        resItem.out_power.b = format_value(out_power_b);

                        var out_power_c = 0;
                        if(item.out_power_c){
                            if(item.out_power_c.points){
                                for(var i in item.out_power_c.points){
                                    var _p = item.out_power_c.points[i];
                                    if(data[_p.serverNO] && data[_p.serverNO][_p.id] && data[_p.serverNO][_p.id][_p.pointIndex]){
                                        out_power_c+=data[_p.serverNO][_p.id][_p.pointIndex];
                                    }
                                }
                            }
                            if(item.out_power_c.exclude){
                                for(var i in item.out_power_c.exclude){
                                    var _p = item.out_power_c.exclude[i];
                                    if(data[_p.serverNO] && data[_p.serverNO][_p.id] && data[_p.serverNO][_p.id][_p.pointIndex]){
                                        out_power_c-=data[_p.serverNO][_p.id][_p.pointIndex];
                                    }
                                }
                            }
                        }
                        resItem.out_power.c = format_value(out_power_c);

                        var power = power_a + power_b + power_c;
                        var out_power = out_power_a + out_power_b + out_power_c;
                        entry.push({power: power, out_power: out_power});
                    }

                    response.push(resItem)
                }

                if(entry.length > 0){//用最新获取的值更新缓存
                    var _buildingData = realTimeProcessor.get_data_by_identity(building);
                    if(_buildingData){
                        _buildingData.entry = entry;
                    }
                }
            }
        };

        var points = [];
        if(building.entry && building.entry.length > 0){
            for(var j=0;j<building.entry.length;j++){
                var item = building.entry[j];
                if(item.power_a){
                    if(item.power_a.points){
                        points = points.concat(item.power_a.points)
                    }
                    if(item.power_a.exclude){
                        points = points.concat(item.power_a.exclude)
                    }
                }
                if(item.power_b){
                    if(item.power_b.points){
                        points = points.concat(item.power_b.points)
                    }
                    if(item.power_b.exclude){
                        points = points.concat(item.power_b.exclude)
                    }
                }
                if(item.power_c){
                    if(item.power_c.points){
                        points = points.concat(item.power_c.points)
                    }
                    if(item.power_c.exclude){
                        points = points.concat(item.power_c.exclude)
                    }
                }

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
            }
        }
        if(points.length > 0){
            serverHelper.get_point_value_list(points, function (err, data) {
                if(err) logger.error(err);

                format_data(data);

                callback(null, response);
            })
        }else{
            format_data();

            callback(null, response);
        }
    }else{
        callback({status: code.not_found, msg: 'building not found'});
    }
}

module.exports.cmd = cmd.cpy_0x00000005;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
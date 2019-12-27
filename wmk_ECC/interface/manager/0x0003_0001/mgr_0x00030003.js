/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var def = require('../../../definition/constants');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var dataHelper = require('../../../protocol/central/server_manager');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var ramdb = db.ramdb;
    var rdbNOR = ramdb.nor;
    var rdbCNO = ramdb.cno;
    var rdbCNOR = ramdb.cnor;

    var response = [];

    var get_instance = function (done) {
        switch(body.classID){
            case 0://空
                var parks = ramdb.no.get_by_class(uiclassID.park);
                for(var k=0;k<parks.length;k++){
                    var park = parks[k];
                    var childs = ramdb.nor.get_child_identity(park.serverNO, park.classID, park.id);
                    var parkItem = {
                        serverNO: park.serverNO,
                        classID: park.classID,
                        id: park.id,
                        fullName: park.fullName,
                        hasChild: childs.length > 0 ? 1: 0
                    };
                    response.push(parkItem);
                }
                break;
                case uiclassID.park:
                case uiclassID.building:
                case uiclassID.province:
                case uiclassID.city:
                    var buildings = rdbNOR.get_child_identity(body.serverNO, body.classID, body.id);
                    //旧数据
                    if(body.classID == uiclassID.building){
                        var childs = rdbCNOR.get_child_identity(body.serverNO, 0, 0);
                        for(var i in childs){
                            var item = rdbCNO.get_by_identity(childs[i]);
                            if(item){
                                var _childs = rdbCNOR.get_child_identity(item.serverNO, item.classID, item.id);
                                response.push({serverNO: item.serverNO, classID: item.classID, id: item.id, name: item.fullName, description: item.description, restData: item.gen_rest_data(), hasChild: _childs.length > 0 ? 1: 0});
                            }
                        }
                    }
                    //采集数数据
                    var c_childs = rdbCNOR.get_child_identity(body.serverNO, body.classID, body.id);
                    for(var i in c_childs){
                        var item = rdbCNO.get_by_identity(c_childs[i]);
                        if(item){
                            var _childs = rdbCNOR.get_child_identity(item.serverNO, item.classID, item.id);
                            response.push({serverNO: item.serverNO, classID: item.classID, id: item.id, name: item.fullName, description: item.description, restData: item.gen_rest_data(), hasChild: _childs.length > 0 ? 1: 0});
                        }
                    }
                    //逻辑树数据
                    for(var i=0;i<buildings.length;i++){
                        var identity = buildings[i];
                        var building = ramdb.no.get_by_identity(identity);
                        if(building){
                            var childs = rdbNOR.get_child_identity(building.serverNO, building.classID, building.id);
                            if(building.classID == uiclassID.building){
                                //旧数据
                                var list = rdbCNOR.get_child_identity(building.serverNO, 0, 0);
                                childs = childs.concat(list);
                            }
                            var _c_childs = rdbCNOR.get_child_identity(building.serverNO, building.classID, building.id);
                            childs = childs.concat(_c_childs);
    
                            var buildingItem = {
                                serverNO: building.serverNO,
                                classID: building.classID,
                                id: building.id,
                                fullName: building.fullName,
                                hasChild: childs.length > 0 ? 1: 0
                            };
    
                            response.push(buildingItem);
                        }
                    }
                    break;
                case uiclassID.area:
                    //逻辑树数据
                    var buildings = rdbNOR.get_child_identity_list(body.serverNO, body.classID, body.id, [uiclassID.floor, uiclassID.room]);
                    if(buildings){
                        for(var i=0;i<buildings.length;i++){
                            var identity = buildings[i];
                            var building = ramdb.no.get_by_identity(identity);
                            if(building){
                                var childs = rdbNOR.get_child_identity(building.serverNO, building.classID, building.id, uiclassID.room);
                                var _c_childs = rdbCNOR.get_child_identity(building.serverNO, building.classID, building.id);
                                childs = childs.concat(_c_childs);
        
                                var buildingItem = {
                                    serverNO: building.serverNO,
                                    classID: building.classID,
                                    id: building.id,
                                    fullName: building.fullName,
                                    hasChild: childs.length > 0 ? 1: 0
                                };
        
                                response.push(buildingItem);
                            }
                        }
                    }
    
                    //采集数数据
                    var c_childs = rdbCNOR.get_child_identity(body.serverNO, body.classID, body.id);
                    for(var i in c_childs){
                        var item = rdbCNO.get_by_identity(c_childs[i]);
                        if(item){
                            var _childs = rdbCNOR.get_child_identity(item.serverNO, item.classID, item.id);
                            response.push({serverNO: item.serverNO, classID: item.classID, id: item.id, name: item.fullName, description: item.description, restData: item.gen_rest_data(), hasChild: _childs.length > 0 ? 1: 0});
                        }
                    }
                    break;
                case uiclassID.floor:
                    //逻辑树数据
                    var buildings = rdbNOR.get_child_identity(body.serverNO, body.classID, body.id, uiclassID.room);
                    for(var i=0;i<buildings.length;i++){
                        var identity = buildings[i];
                        var building = ramdb.no.get_by_identity(identity);
                        if(building){
                            var childs = [];
                            var _c_childs = rdbCNOR.get_child_identity(building.serverNO, building.classID, building.id);
                            childs = childs.concat(_c_childs);
    
                            var buildingItem = {
                                serverNO: building.serverNO,
                                classID: building.classID,
                                id: building.id,
                                fullName: building.fullName,
                                hasChild: childs.length > 0 ? 1: 0
                            };
    
                            response.push(buildingItem);
                        }
                    }
    
                    //采集数数据
                    var c_childs = rdbCNOR.get_child_identity(body.serverNO, body.classID, body.id);
                    for(var i in c_childs){
                        var item = rdbCNO.get_by_identity(c_childs[i]);
                        if(item){
                            var _childs = rdbCNOR.get_child_identity(item.serverNO, item.classID, item.id);
                            response.push({serverNO: item.serverNO, classID: item.classID, id: item.id, name: item.fullName, description: item.description, restData: item.gen_rest_data(), hasChild: _childs.length > 0 ? 1: 0});
                        }
                    }
                    break;
                case uiclassID.room:
            case uiclassID.collector:
            case uiclassID.cArea:
            case uiclassID.cDTU:
            case uiclassID.cCS:
                var childs = rdbCNOR.get_child_identity(body.serverNO, body.classID, body.id);
                for(var i in childs){
                    var item = rdbCNO.get_by_identity(childs[i]);
                    if(item){
                        var _childs = rdbCNOR.get_child_identity(item.serverNO, item.classID, item.id);
                        response.push({serverNO: item.serverNO, classID: item.classID, id: item.id, fullName: item.fullName, description: item.description, restData: item.gen_rest_data(), hasChild: _childs.length > 0 ? 1: 0});
                    }
                }
                break;
        }

        done();
    };

    var get_instance_state = function (done) {
        switch(body.classID){
            case 0://空
                for(var i=0;i<response.length;i++){
                    var item = response[i];
                    item.online = def.onlinePV;
                }
                done();
                break;
            case uiclassID.park:
            case uiclassID.building:
            case uiclassID.collector:
                var devices = [];
                for(var i=0;i<response.length;i++){
                    var item = response[i];
                    item.online = def.unknownPV;
                    devices.push({serverNO: item.serverNO, classID: item.classID, id: item.id});
                }
                var msg = new DataMessage(CentralCMD.cen_0x00010003, {devices: devices});
                dataHelper.send(msg, function (err, results) {
                    if(err){
                        logger.error({msg: 'get device state failed', err: err});
                    }

                    if(results){
                        var dic = {};
                        for(var i=0;i<results.length;i++){
                            var item = results[i];
                            dic[format_key(item.serverNO, item.classID, item.id)] = item.online;
                        }

                        for(var i=0;i<response.length;i++){
                            var item = response[i];
                            var key = format_key(item.serverNO, item.classID, item.id);
                            if(dic[key] != undefined){
                                item.online = dic[key];
                            }
                        }
                    }

                    done();
                });
                break;
            default:
                done();
                break;
        }
    };

    get_instance(function () {
        get_instance_state(function () {
            callback(null, response);
        })
    })
}

module.exports.cmd = cmd.mgr_0x00030003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
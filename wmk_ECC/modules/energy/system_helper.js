/**
 * Created by wangxh on 2018/1/30.
 */

'use strict';

var uiclassID = require('../../definition/uiClassID');
var db = require('../../db');
var ramdb = db.ramdb;

const _area_list = [];
const _building_list = [];

function reset() {
    _area_list.splice(0, _area_list.length);
    _building_list.splice(0, _building_list.length);

    var areaList = ramdb.no.get_by_class(uiclassID.area);
    for(var k=0;k<areaList.length;k++){
        var area = areaList[k];

        var _deviceSystemDic = {};
        var cache_device = function (device) {
            var _type = ramdb.dep.get_device_type(device.type);
            if (_type) {
                var esType = undefined;
                if (_type.config) {
                    esType = _type.config.esType;
                }
                if(esType){
                    if(!_deviceSystemDic[esType.system]){
                        _deviceSystemDic[esType.system] = {};
                    }
                    if(!_deviceSystemDic[esType.system][esType.group]){
                        _deviceSystemDic[esType.system][esType.group] = [];
                    }
                    _deviceSystemDic[esType.system][esType.group].push(device);
                }
            }
        };
        var children = area.children;
        if(children){
            for(var i=0;i<children.length;i++){
                var item = children[i];
                if(item.classID >= uiclassID.device && item.classID <= uiclassID.lastDevice){
                    var device = ramdb.no.get_by_identity(item);
                    if(device){
                        cache_device(device)
                    }
                }else{
                    var identityList = ramdb.nor.get_child_identity_range(item.serverNO, item.classID, item.id, uiclassID.device, uiclassID.lastDevice);
                    if(identityList && identityList.length > 0){
                        for(var l = 0;l<identityList.length;l++){
                            var device = ramdb.no.get_by_identity(identityList[l]);
                            if(device){
                                cache_device(device);
                            }
                        }
                    }
                }
            }
        }

        for(var system in _deviceSystemDic){
            for(var group in _deviceSystemDic[system]){
                _area_list.push({area: area, system: parseInt(system), group: parseInt(group), deviceList: _deviceSystemDic[system][group]});
            }
        }
    }

    var buildingList = ramdb.no.get_by_class(uiclassID.building);
    for(var i=0;i<buildingList.length;i++){
        var building = buildingList[i];
        var _deviceSystemDic = {};
        var deviceList = ramdb.no.get_by_class_rang(uiclassID.device, uiclassID.lastDevice, building.serverNO);
        for(var k=0;k<deviceList.length;k++){
            var device = deviceList[k];
            var _type = ramdb.dep.get_device_type(device.type);
            if (_type) {
                var esType = undefined;
                if (_type.config) {
                    esType = _type.config.esType;
                }
                if(esType){
                    var key = format_key(esType.system, esType.group);

                    if(!_deviceSystemDic[key]){
                        _deviceSystemDic[key] = {building: building, system: esType.system, group: esType.group, deviceList: []};
                    }
                    _deviceSystemDic[key].deviceList.push(device);
                }
            }
        }
        for(var k in _deviceSystemDic){
            var item = _deviceSystemDic[k];
            _building_list.push(item);
        }
    }
}

function belong_to_building(building, device) {
    return device.serverNO == building.building.serverNO;
}

function belong_to_area(area, device) {
    var res = false;
    var children = area.children;
    if(children){
        for(var i=0;i<children.length;i++){
            var item = children[i];
            if(item.classID >= uiclassID.device && item.classID <= uiclassID.lastDevice){
                if(item.serverNO == device.serverNO && item.classID == device.classID && item.id == device.id){
                    return true;
                }
            }else{
                var identityList = ramdb.nor.get_child_identity_range(item.serverNO, item.classID, item.id, uiclassID.device, uiclassID.lastDevice);
                if(identityList && identityList.length > 0){
                    for(var l = 0;l<identityList.length;l++){
                        var identity = identityList[l];
                        if(identity.serverNO == device.serverNO && identity.classID == device.classID && identity.id == device.id){
                            return true;
                        }
                    }
                }
            }
        }
    }
    return res;
}

function update_object(identity) {
    var device = ramdb.no.get_by_identity(identity);
    if(device){
        var esType = undefined;
        var _type = ramdb.dep.get_device_type(device.type);
        if (_type && _type.config) {
            esType = _type.config.esType;
        }

        var isFound = false;
        for(var i=0;i<_area_list.length;i++){
            var item = _area_list[i];
            if(!isFound){
                for(var j=0;j<item.deviceList.length;j++) {
                    var _device = item.deviceList[j];
                    if (_device.serverNO == device.serverNO && _device.classID == device.classID && _device.id == device.id) {
                        item.deviceList.splice(j, 1);
                        isFound = true;
                        break;
                    }
                }
            }
            if(esType && esType.system == item.system && esType.group == item.group && belong_to_area(item.area, device)){
                item.deviceList.push(device);
            }
        }

        isFound = false;
        for(var i=0;i<_building_list.length;i++){
            var item = _building_list[i];
            if(!isFound){
                for(var j=0;j<item.deviceList.length;j++) {
                    var _device = item.deviceList[j];
                    if (_device.serverNO == device.serverNO && _device.classID == device.classID && _device.id == device.id) {
                        item.deviceList.splice(j, 1);
                        isFound = true;
                        break;
                    }
                }
            }
            if(esType && esType.system == item.system && esType.group == item.group && belong_to_building(item.building, device)){
                item.deviceList.push(device);
            }
        }
    }
}

function remove_object(identity) {
    for(var i=0;i<_area_list.length;i++){
        var item = _area_list[i];
        for(var j=0;j<item.deviceList.length;j++) {
            var _device = item.deviceList[j];
            if (_device.serverNO == identity.serverNO && _device.classID == identity.classID && _device.id == identity.id) {
                item.deviceList.splice(j, 1);
                break;
            }
        }
    }
    for(var i=0;i<_building_list.length;i++){
        var item = _building_list[i];
        for(var j=0;j<item.deviceList.length;j++) {
            var _device = item.deviceList[j];
            if (_device.serverNO == identity.serverNO && _device.classID == identity.classID && _device.id == identity.id) {
                item.deviceList.splice(j, 1);
                break;
            }
        }
    }
}

module.exports.AreaList = _area_list;
module.exports.BuildingList = _building_list;
module.exports.reset = reset;
module.exports.update_object = update_object;
module.exports.remove_object = remove_object;
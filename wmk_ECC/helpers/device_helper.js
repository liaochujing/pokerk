/**
 * Created by wangxh on 2017/11/4.
 */

'use strict';

var uiclassID = require('../definition/uiClassID');

var db = require('../db');
var ramdb = db.ramdb;

function get_device_path(identity) {
    var path = '';

    if(identity.classID >= uiclassID.device && identity.classID <= uiclassID.lastDevice){
        var obj = ramdb.no.get_by_identity(identity);
        while(obj){
            path = ('/' + obj.fullName) + path;
            var _parent = ramdb.nor.get_parent_identity(obj.serverNO, obj.classID, obj.id);
            if(_parent){
                obj = ramdb.no.get_by_identity(_parent);
            }else{
                break;
            }
        }
    }else if(identity.classID >= uiclassID.cObject && identity.classID <= uiclassID.lastCObject){
        var obj = ramdb.cno.get_by_identity(identity);
        while(obj){
            path = ('/' + obj.fullName) + path;
            var _parent = ramdb.cnor.get_parent_identity(obj.serverNO, obj.classID, obj.id);
            if(_parent){
                obj = ramdb.cno.get_by_identity(_parent);
            }else{
                break;
            }
        }
        var obj = ramdb.no.get_building(identity.serverNO);
        while(obj){
            path = ('/' + obj.fullName) + path;
            var _parent = ramdb.nor.get_parent_identity(obj.serverNO, obj.classID, obj.id);
            if(_parent){
                obj = ramdb.no.get_by_identity(_parent);
            }else{
                break;
            }
        }
    }

    return path;
}

function get_device_type_config(device) {
    var config = undefined;
    if(device && device.type){
        var _type = ramdb.dep.get_device_type(device.type);
        if(_type){
            config = _type.config;
        }
    }
    return config;
}

module.exports.get_device_path = get_device_path;
module.exports.get_device_type_config = get_device_type_config;
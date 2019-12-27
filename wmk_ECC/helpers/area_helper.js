/**
 * Created by wangxh on 2018/1/31.
 */

'use strict';

var RoomType = require('../definition/room_type');
var uiclassID = require('../definition/uiClassID');

var db = require('../db');
var ramdb = db.ramdb;

function get_child_object(area, classID) {
    var _res = [];
    var childs = ramdb.nor.get_child_identity_range(area.serverNO, area.classID, area.id, classID);
    if(childs){
        for(var i=0;i<childs.length;i++){
            var identity = childs[i];
            var vd = ramdb.no.get_by_identity(identity);
            if(vd){
                _res.push(vd);
            }
        }
    }

    return _res;
}

function get_child_object_list(area, array) {
    var results = [];

    var childs = ramdb.nor.get_child_identity_list(area.serverNO, area.classID, area.id, array);
    if(childs){
        for(var i=0;i<childs.length;i++){
            var item = childs[i];
            var obj = ramdb.no.get_by_identity(item);
            if(obj){
                results.push(obj);
            }
        }
    }

    return results;
}

function get_data_room(identity) {
    var res = undefined;

    if(identity){
        res = _get_area_data_room(identity);
    }else{
        var roomList = ramdb.no.get_by_class(uiclassID.room);
        for(var i=0;i<roomList.length;i++){
            var room = roomList[i];

            //没有数据机房概念
            // if(room.rmType == RoomType.data){
                if(!res){
                    res = [];
                }
                res.push(room);
            // }
        }
    }
    
    return res;
}

function _get_area_data_room(identity) {
    var res = [];

    if(identity.classID == uiclassID.room){
        var room = ramdb.no.get_by_identity(identity);
        if(room/* && room.rmType == RoomType.data*/){
            res.push(room);
        }
    }else{
        var roomList = ramdb.nor.get_child_identity_range(identity.serverNO, identity.classID, identity.id, uiclassID.room);
        if(roomList){
            for(var i=0;i<roomList.length;i++){
                var item = roomList[i];
                var room = ramdb.no.get_by_identity(item);
                if(room/* && room.rmType == RoomType.data*/){
                    res.push(room);
                }
            }
        }
    }

    return res;
}

function get_child_identity(parentServerNO, parentClassID, parentID, childClassID) {
    var res = undefined;

    res = ramdb.nor.get_child_identity(parentServerNO, parentClassID, parentID, childClassID);

    return res;
}

function get_child_identity_range(parentServerNO, parentClassID, parentID, minClassID, maxClassID) {
    var res_arr = undefined;

    if(maxClassID == undefined){
        maxClassID = minClassID;
    }
    res_arr = ramdb.nor.get_child_identity_range(parentServerNO, parentClassID, parentID, minClassID, maxClassID);

    return res_arr;
}

function get_child_identity_list(parentServerNO, parentClassID, parentID, list) {
    var dic = {};
    for(var i=0;i<list.length;i++){
        var item = list[i];
        dic[item] = 1;
    }

    var res_arr = undefined;
    res_arr = ramdb.nor.get_child_identity_dic(parentServerNO, parentClassID, parentID, dic);

    return res_arr;
}


function get_all_child(identity, classIDs) {
    var results = [];
    var areaList = db.ramdb.nor.get_child_identity_list(identity.serverNO, identity.classID, identity.id, classIDs);
    if(areaList != null && areaList.length > 0){
        results = results.concat(areaList);
        for(let i=0;i<areaList.length;i++){
            let item = areaList[i];
            var areaList2 = db.ramdb.nor.get_child_identity_list(item.serverNO, item.classID, item.id, classIDs);
            if(areaList2 != null && areaList2.length > 0){
                results = results.concat(areaList2);
            }
        }
    }

    return results;
}

module.exports.get_child_object = get_child_object;
module.exports.get_child_object_list = get_child_object_list;

module.exports.get_data_room = get_data_room;
module.exports.get_child_identity = get_child_identity;
module.exports.get_child_identity_range = get_child_identity_range;
module.exports.get_child_identity_list = get_child_identity_list;

module.exports.get_all_child = get_all_child;
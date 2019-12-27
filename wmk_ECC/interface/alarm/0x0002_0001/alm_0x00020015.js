/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var area_helper = require('../../../helpers/area_helper');

var db = require('../../../db');
var rdbNO = db.ramdb.no;

function handle(req, res, body, callback) {

    var dbAlarm = db.alarm;

    var option = [];

    var query = {isConfirmed: null, isForce: null, isHangup: {$ne: 1}, isFiltered: null};
    var area = body;
    if(area.classID == uiclassID.park){
        var buildings = db.ramdb.nor.get_child_identity(area.serverNO, area.classID, area.id, uiclassID.building);
        var mNOS = [area.serverNO];
        for(var i in buildings){
            var item = buildings[i];
            mNOS.push(item.serverNO);
        }
        query.serverNO = {$in: mNOS};
    }else if(area.classID == uiclassID.building){
        query.serverNO = area.serverNO;
    }else{
        var idList = [];

        var areaList = area_helper.get_all_child(area, [uiclassID.area]);
        if(areaList){
            for(let j=0;j<areaList.length;j++){
                let temps = areaList[j];
                idList.push(temps.id);
    
                var areaList2 = area_helper.get_all_child(temps, [uiclassID.building, uiclassID.floor, uiclassID.room, uiclassID.area]);
                if(areaList2){
                    for(var i in areaList2){
                        idList.push(areaList2[i].id);
                    }
                }
            }
        }
        query.area = {$in: idList};
    }

    option.push({$match: query});
    option.push({$group: {
        _id: {
            serverNO: '$serverNO',
            id: '$area',
            level: '$level'
        },
        count: {$sum: 1}
    }});
    option.push({$sort: {count : -1}});
    option.push({$limit: 100});

    dbAlarm.aggregate(option, function (err, results) {
        if(err) logger.error(err);

        var response = [];
        var _dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var _id = item._id;
                var _level = _id.level;
                var count = item.count;

                var obj = rdbNO.get_no_sync(_id.serverNO, null, _id.id);
                if(obj){
                    var _key = null;
                    if(obj.classID == uiclassID.area){
                        _key = format_key(obj.serverNO, obj.id);
                    }else{
                        let parents = db.ramdb.nor.get_parent_identity(obj.serverNO, obj.classID, obj.id, uiclassID.area);
                        if(parents){
                            obj = rdbNO.get_no_sync(parents.serverNO, null, parents.id);
                            if(obj){
                                _key = format_key(obj.serverNO, obj.id);
                            }
                        }
                    }
                
                    if(_key){
                        if(!_dic[_key]){
                            var _item = undefined;
                            
                            if(obj){
                                _item = {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, name: obj.fullName, list: []};
                            }else{
                                _item = {serverNO: _id.serverNO, classID: null, id: _id.id, name: '未知对象', list: []};
                            }
                            response.push(_item);
                            _dic[_key] = _item;
                        }
        
                        _dic[_key].list.push({level: _level, count: count});
                    }
                }
            }
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.alm_0x00020015;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
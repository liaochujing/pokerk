/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var PrivilegePoint = require('../../../definition/privilege_point');
var OrderState = require('../../../modules/order/definition/order_state');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');

function handle(req, res, body, callback) {

    var datadb = db.datadb;
    var ramdb = db.ramdb;
    var rdbNO = ramdb.no;
    var rdbNOR = ramdb.nor;

    var dic = {};

    function get_child_area_list(area, typeList) {
        var result = [];
        if(area.classID >= uiclassID.area && area.classID < uiclassID.room){
            var childs = ramdb.nor.get_child_identity(area.serverNO, area.classID, area.id);
            for(var i=0;i<childs.length;i++){
                var item = childs[i];

                if(typeList.indexOf(item.classID) >= 0 && item.classID <= uiclassID.room){
                    result.push(item);
                }
                if(item.classID < uiclassID.room){
                    result = result.concat(get_child_area_list(item, typeList))
                }
            }
        }

        return result;
    }
    
    for(var i=0;i<body.areas.length;i++){
        var item = body.areas[i];
        var key = format_key(item.serverNO, item.classID, item.id);
        dic[key] = item;
        var childs = get_child_area_list(item, [uiclassID.area, uiclassID.building, uiclassID.floor, uiclassID.room]);
        if(childs && childs.length > 0){
            for(var j=0;j<childs.length;j++){
                var child = childs[j];
                var _key = format_key(child.serverNO, child.classID, child.id);
                dic[_key] = child;
            }
        }
    }

    var query = {classID: uiclassID.assetOrder};
    var _sources = [];
    for(var i in dic){
        var item = dic[i];
        _sources.push({'region.serverNO': item.serverNO, 'region.classID': item.classID, 'region.id': item.id});
    }
    query['$or'] = _sources;
    // if(body.deviceClassID && body.deviceClassID.length > 0){
    //     query['restData.source.classID'] = {$in: body.deviceClassID};
    // }
    var _deviceClassIDDic = undefined;
    if(body.deviceClassID && body.deviceClassID.length > 0){
        _deviceClassIDDic = {};
        for(var i=0;i<body.deviceClassID.length;i++){
            var _classID = body.deviceClassID[i];
            _deviceClassIDDic[_classID] = 1;
        }
    }
    if(body.level &&  body.level.length > 0){
        query.level = {$in: body.level};
    }
    query.state = OrderState.finished;
    
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    query['restData.mTime'] = {$gte: startTime, $lt: endTime};

    var dbOrder = db.order;
    dbOrder.find_order(query, {serverNO: 1, classID: 1, id: 1, fullName: 1, restData: 1, state: 1}, function (err, results) {
        if(err) logger.error(err);

        var response = [];
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];

                var deviceClassID = undefined;
                var deviceName = undefined;
                var roomName = undefined;

                var aNO = item.restData.asset.aNO;
                var asset = ramdb.asset.get_asset_sync(aNO);
                if(asset){
                    deviceName = asset.name;
                }
                var device = ramdb.no.get_by_asset_no(aNO);
                if(device){
                    deviceClassID = device.classID;
                    if(_deviceClassIDDic && !_deviceClassIDDic[deviceClassID]){
                        continue;
                    }
                    deviceName = device.fullName;

                    var _room = rdbNOR.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.room);
                    if(_room){
                        var room = rdbNO.get_by_identity(_room);
                        roomName = room.fullName;
                    }
                }else{
                    if(_deviceClassIDDic){
                        continue;
                    }
                }
                var maintainName = undefined;
                if(item.restData.maintain){
                    var _operator = ramdb.oo.get_operator_by_id(item.restData.maintain);
                    if(_operator){
                        maintainName = _operator.fullName;
                    }
                }

                response.push({
                    // serverNO: item.serverNO,
                    // classID: item.classID,
                    id: item.id,
                    // level: item.level,
                    name: item.fullName,
                    room: roomName,
                    deviceClassID: deviceClassID,
                    device: deviceName,
                    state: item.state,
                    maintain: maintainName,
                    planTime: item.restData.planTime,
                    mTime: item.restData.mTime,
                    // time: item.restData.startTime
                })
            }
        }

        callback(null, response)
    })
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010007;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        areas: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true}
                }
            },
            required: true
        },
        deviceClassID: {type: 'array', items: {type: 'number'}},
        level: {type: 'array', items: {type: 'number'}},
        startTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true},
        endTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true}
    }
};
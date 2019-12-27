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
        if(area.classID >= uiclassID.park && area.classID < uiclassID.building){
            var childs = ramdb.nor.get_child_identity(area.serverNO, area.classID, area.id);
            for(var i=0;i<childs.length;i++){
                var item = childs[i];

                if(typeList.indexOf(item.classID) >= 0 && item.classID <= uiclassID.building){
                    result.push(item);
                }
                if(item.classID < uiclassID.building){
                    result = result.concat(get_child_area_list(item, typeList))
                }
            }
        }

        return result;
    }

    function get_parent_area_list(area) {
        var res = [];

        var _parent = ramdb.nor.get_parent_identity(area.serverNO, area.classID, area.id);
        while(_parent && _parent.classID >= uiclassID.park && _parent.classID < uiclassID.building){
            res.push(_parent);
            _parent = ramdb.nor.get_parent_identity(_parent.serverNO, _parent.classID, _parent.id);
        }

        return res;
    }
    
    for(var i=0;i<body.areas.length;i++){
        var item = body.areas[i];
        var key = format_key(item.serverNO, item.classID, item.id);
        dic[key] = item;

        var childs = get_child_area_list(item, [uiclassID.building]);
        if(childs && childs.length > 0){
            for(var j=0;j<childs.length;j++){
                var child = childs[j];
                var _key = format_key(child.serverNO, child.classID, child.id);
                dic[_key] = child;
            }
        }
        var parents = get_parent_area_list(item);
        if(parents && parents.length > 0){
            for(var j=0;j<parents.length;j++){
                var parent = parents[j];
                var _key = format_key(parent.serverNO, parent.classID, parent.id);
                dic[_key] = parent;
            }
        }
    }

    var query = {classID: uiclassID.drillOrder};
    var _sources = [];
    for(var i in dic){
        var item = dic[i];
        _sources.push({'region.serverNO': item.serverNO, 'region.classID': item.classID, 'region.id': item.id});
    }
    query['$or'] = _sources;
    if(body.level &&  body.level.length > 0){
        query.level = {$in: body.level};
    }
    query.state = OrderState.finished;
    
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    query['restData.mTime'] = {$gte: startTime, $lt: endTime};

    var dbOrder = db.order;
    dbOrder.find_order(query, {serverNO: 1, classID: 1, id: 1, region: 1, fullName: 1, restData: 1, state: 1}, function (err, results) {
        if(err) logger.error(err);

        var response = [];
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];

                var buildingName = undefined;
                if(item.region.classID == uiclassID.building){
                    var building = ramdb.no.get_by_identity(item.region);
                    if(building){
                        buildingName = building.fullName;
                    }
                }

                var maintainName = undefined;
                if(item.restData.participant){
                    var names = [];
                    for(var j=0;j<item.restData.participant.length;j++){
                        var _operator = ramdb.oo.get_operator_by_id(item.restData.participant[j]);
                        if(_operator){
                            names.push(_operator.fullName);
                        }
                    }
                    maintainName = names.join(',');
                }

                response.push({
                    // serverNO: item.serverNO,
                    // classID: item.classID,
                    id: item.id,
                    // level: item.level,
                    name: item.fullName,
                    building: buildingName,
                    state: item.state,
                    planTime: item.restData.planTime,
                    mTime: item.restData.mTime,
                    participant: maintainName,
                    // time: item.restData.startTime
                })
            }
        }

        callback(null, response)
    })
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010008;
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
        level: {type: 'array', items: {type: 'number'}},
        startTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true},
        endTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true}
    }
};
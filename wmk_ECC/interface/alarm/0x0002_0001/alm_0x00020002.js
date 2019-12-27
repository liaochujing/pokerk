/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var area_helper = require('../../../helpers/area_helper');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbAlarm = db.alarm;
    var ramdb = db.ramdb;

    var query = {isConfirmed: null, isForce: null, isHangup: {$ne: 1}, isFiltered: null};
    if(body.area){
        var area = body.area;
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
            var idList = [area.id];
            var areaList = area_helper.get_all_child(area, [uiclassID.building, uiclassID.floor, uiclassID.room, uiclassID.area]);
            if(areaList){
                for(var i in areaList){
                    idList.push(areaList[i].id);
                }
            }

            query.serverNO = area.serverNO;
            query.area = {$in: idList};
        }
    }
    if(body.source){
        query['source.serverNO'] = body.source.serverNO;
        query['source.classID'] = body.source.classID;
        query['source.id'] = body.source.id;
    }
    if(body.type != undefined){
        query.type = body.type;
    }

    var limit = body.limit || 50;

    var alarms = [];
    dbAlarm.find_alarm(query, {_id: 0}).sort({startTime: -1}).limit(limit).toArray(function (err, results) {
        if(err) return callback({status: code.unknown});

        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];

                var source = item.source;
                if(source){
                    var device = undefined;
                    // if(source.classID >= uiclassID.device && source.classID <= uiclassID.lastDevice){
                        device = ramdb.no.get_by_identity(source);
                    // }else{
                    //     device = ramdb.cno.get_by_identity(source);
                    // }
                    if(device){
                        source.name = device.fullName;
                    }
                }
                if(item.confirmed){
                    var user = ramdb.oo.get_operator_by_id(item.confirmed.user);
                    if(user){
                        item.confirmed.name = user.fullName;
                    }
                }
                if(item.force){
                    var user = ramdb.oo.get_operator_by_id(item.force.user);
                    if(user){
                        item.force.name = user.fullName;
                    }
                }
                if(item.hangup){
                    var user = ramdb.oo.get_operator_by_id(item.hangup.user);
                    if(user){
                        item.hangup.name = user.fullName;
                    }
                }
            }
        }

        callback(null, results);
    });
}

module.exports.cmd = cmd.alm_0x00020002;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        area: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            }
        },
        source: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            }
        },
        type: {type: 'number'},
        limit: {type: 'number'}
    }
};
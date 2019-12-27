/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbAlarm = db.alarm;
    var ramdb = db.ramdb;

    var query = {};

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

            var areaList = db.ramdb.nor.get_child_identity_list(area.serverNO, area.classID, area.id, [uiclassID.building, uiclassID.floor, uiclassID.room]);
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

    var option = [{$match: query}, {$sort: {startTime: -1}}, {$project: {
        _id: 0,
        i: ['$serverNO', '$classID', '$id', '$desc', '$level', '$startTime'],
        c: '$isConfirmed',
        et: '$endTime',//结束时间
        ft: '$force.time',//强制结束时间
        h: '$isHangup',//是否挂起
        p: '$parent',//收敛
        s: '$star',//星标
    }}];

    dbAlarm.aggregate(option, function (err, data) {
        if(err) return callback({status: code.unknown});
        if(data){
            for(var i=data.length - 1;i>=0;i--){
                var item = data[i];
                item.i[5] = item.i[5].to_unix();
                if(item.et){
                    item.et = item.et.to_unix();
                }
                if(item.ft){
                    item.ft = item.ft.to_unix();
                }
            }
        }
        
        callback(null, data);
    });
}

module.exports.cmd = cmd.alm_0x00020008;
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
        pageIndex: {type: 'number', required: true},
        pageSize: {type: 'number', required: true}
    }
};
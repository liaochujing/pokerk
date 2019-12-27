/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');

var db = require('../../../db');
var rdbNO = db.ramdb.no;
var rdbCNO = db.ramdb.cno;
var rdbDEP = db.ramdb.dep;
var rdbCDT = db.ramdb.cdt;
var dbCDP = db.cdp

function handle(req, res, body, callback) {
    var response = [];

    var _list = [];
    for(var i=0;i<body.length;i++){
        var item = body[i];
        if(item.classID >= uiclassID.cObject && item.classID <= uiclassID.lastCObject){
            var cno = rdbCNO.get_by_identity(item);
            if(cno){
                if(item.pointIndex != undefined){//采集点
                    if(cno.type){
                        var point = rdbCDT.get_collect_device_type_point(cno.type, item.pointIndex);
                        if(point){
                            item.name = point.name;
                            item.unit = point.unit;
                            response.push(item);
                        }
                    }else{
                        _list.push(item);
                    }
                }else{
                    item.name = cno.fullName;
                    response.push(item);
                }
            }
        }else{
            var no = rdbNO.get_by_identity(item);
            if(no){
                if(item.pointIndex != undefined){//逻辑点
                    var point = rdbDEP.get_device_type_point(no.type, item.pointIndex);
                    if(point){
                        item.name = point.name;
                        item.unit = point.unit;
                        response.push(item);
                    }
                }else{
                    item.name = no.fullName;
                    response.push(item);
                }
            }
        }
    }

    if(_list.length > 0){
        dbCDP.find_collect_device_point({$or: _list}, {_id: 0, serverNO: 1, classID: 1, id: 1, pointIndex: 1, name: 1, unit: 1}, function (err, results) {
            if(err) return callback(err);
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    response.push({serverNO: item.serverNO, classID: item.classID, id: item.id, pointIndex: item.pointIndex, name: item.name, unit: item.unit})
                }
            }
            callback(null, response);
        });
    }else{
        callback(null, response);
    }
}

module.exports.cmd = cmd.itr_0x00000011;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            serverNO: {type: 'integer', required: true},
            classID: {type: 'integer', required: true},
            id: {type: 'integer', required: true},
            pointIndex: {type: 'integer'}
        }
    }
};
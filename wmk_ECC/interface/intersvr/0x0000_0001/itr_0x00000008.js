/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var identity = body;
    
    var rdbDEP = db.ramdb.dep;

    var pointList = [];
    var device = db.ramdb.no.get_by_identity(body);
    if(device){
        var template = rdbDEP.get_device_type(device.type);
        if(template){
            for(var i=0;i<template.pointList.length;i++){
                var item = template.pointList[i];

                var _p = {
                    index: item.pointIndex,
                    type: item.pointType,
                    name: item.name,
                    unit: item.unit,
                    desc: item.desc,
                    busType: item.busType
                };
  
                pointList.push(_p)
            }
        }
    }
    callback(null, pointList);
}

module.exports.cmd = cmd.itr_0x00000008;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
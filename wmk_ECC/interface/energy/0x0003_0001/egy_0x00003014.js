/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');
var datadb = db.datadb;

function handle(req, res, body, callback) {
    if(body.list.length <= 0){
        return callback();
    }

    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    var classID = body.list[0].classID;

    var _collection = undefined;
    if(classID == uiclassID.room){
        _collection = datadb.rmmon;
    }else if(classID >= uiclassID.area && classID <= uiclassID.lastArea){
        _collection = datadb.ammon;
    }else if(classID == uiclassID.cabinet){
        _collection = datadb.cmmon;
    }else{
        _collection = datadb.dmmon;
    }
    var key = body.key;

    var fields = {serverNO: 1, classID: 1, id: 1, month: 1};
    fields[key] = 1;
    _collection.query({$or: body.list, time: {$gte: startTime, $lt: endTime}}, fields, function (err, results) {
        if(err) return callback(err);

        var response = [];
        if(results){
            var _dic = {};
            for(var i=0;i<results.length;i++){
                var item = results[i];

                if(!_dic[item.id]){
                    var _res = {serverNO: item.serverNO, classID: item.classID, id: item.id, list: []};
                    _dic[item.id] = _res;
                    response.push(_res)
                }
                _dic[item.id].list.push({value: item[key] || 0, month: item.month});
            }
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00003014;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        list: {
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
        key: {type: 'string', required: true},
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};
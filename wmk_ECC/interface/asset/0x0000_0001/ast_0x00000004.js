/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var logger = require('../../../util/log_manager').logger;

var db = require('../../../db/index');

function handle(req, res, body, callback) {

    var pageIndex = body.pageIndex || 0;
    var pageSize = body.pageSize || 1000;
    if(pageSize > 1000){
        pageSize = 1000;
    }else if(pageSize < 0){
        pageSize = 1000;
    }

    var dbAsset = db.asset;

    var query = {};

    if(body.state != undefined){
        query.state = {$in: body.state};
    }
    var _and = [];
    if(body.type){
        var _types = [];
        for(var i=0;i<body.type.length;i++){
            var _item = body.type[i];
            _types.push({'type.system': _item.system, 'type.group': _item.group});
        }
        _and.push({$or: _types})
    }
    if(body.areas != undefined){
        var _areas = [];
        for(var i=0;i<body.areas.length;i++) {
            var area = body.areas[i];
            _areas.push({'region.serverNO': area.serverNO, 'region.classID': area.classID, 'region.id': area.id});
        }
        _and.push({$or: _areas})
    }
    if(body.filter){
        _and.push({$or: [{aNO: {$regex: body.filter}}, {name: {$regex: body.filter}}, {brand: {$regex: body.filter}}, {model: {$regex: body.filter}}]});
    }
    if(_and.length > 0){
        query['$and'] = _and;
    }
    query._state = {$ne: 1};//未删除

    var total = 0;
    dbAsset.count(query, function (err, count) {
        if(err) logger.error(err);
        if(count){
            total = count;
        }

        dbAsset.collection.find(query, {_id: 0}).sort({createTime: -1}).skip(pageIndex * pageSize).limit(pageSize).toArray(function (err, results) {
            if(err) logger.error(err);

            var list = results;
            callback(null, {total: total, pageIndex: pageIndex, pageSize: pageSize, list: list});
        });
    });
}

module.exports.privilege = PrivilegePoint.queryAsset;
module.exports.cmd = cmd.ast_0x00000004;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        pageIndex: {type: 'number'},
        pageSize: {type: 'number'},

        filter: {type: 'string'},
        type: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    system: {type: 'number', required: true},
                    group: {type: 'number', required: true}
                }
            }
        },
        areas: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true}
                }
            }
        },
        state: {type: 'array', items: {type: 'number'}}
    }
};
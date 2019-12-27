/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var db = require('../../../db/index');
var dbPart = db.parts;

function handle(req, res, body, callback) {
    var query = {};
    if(body.filter){
        query['$or'] = [{name: {$regex: body.filter}},{brand: {$regex: body.filter}},{model: {$regex: body.filter}}]
    }
    if(body.type){
        query.type = {$in: body.type}
    }
    if(body.state){
        query.state = {$in: body.state}
    }
    query._state = {$ne: 1};//过滤删除的

    var pageIndex = body.pageIndex || 0;
    var pageSize = body.pageSize || 1000;
    if(pageSize > 1000){
        pageSize = 1000;
    }else if(pageSize < 0){
        pageSize = 1000;
    }

    var total = 0;
    dbPart.count(query, function (err, count) {
        if(err) logger.error(err);
        if(count){
            total = count;
        }

        dbPart.find_parts(query, {_id: 0, _state: 0}).sort({createTime: -1}).skip(pageIndex * pageSize).limit(pageSize).exec(function (err, results) {
            if(err) return callback(err);

            callback(null, {total: total, pageIndex: pageIndex, pageSize: pageSize, list: results});
        })
    });
}

module.exports.cmd = cmd.ast_0x00000016;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        pageIndex: {type: 'number'},
        pageSize: {type: 'number'},

        filter: {type: 'string'},
        type: {
            type: 'array',
            items: {type: 'number'}
        },
        state: {
            type: 'array',
            items: {type: 'number'}
        }
    }
};
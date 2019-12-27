/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var db = require('../../../db/index');
var rdbAsset = db.ramdb.asset;
var dbParts = db.parts;

function handle(req, res, body, callback) {
    var response = {};

    var get_asset_info = function (done) {
        var _dic = {};

        var assetDic = rdbAsset.get_all_asset();
        for(var key in assetDic){
            var asset = assetDic[key];
            if(asset.type){
                var system = asset.type.system;
                var group = asset.type.group;
                var state = asset.state;

                var _key = format_key(system, group, state);
                if(!_dic[_key]){
                    _dic[_key] = {system: system, group: group, state: state, count: 0};
                }
                _dic[_key].count++;
            }
        }

        var typeList = [];
        for(var key in _dic){
            typeList.push(_dic[key]);
        }

        response.typeList = typeList;

        done();
    };

    // var get_part_info = function (done) {
    //     dbParts.aggregate([
    //         {$match: {_state: {$ne: 1}}},
    //         {$group: {
    //             _id: '$state',
    //             count: {$sum: 1}
    //         }}
    //     ], function (err, results) {
    //         if(err) logger.error(err);
    //
    //         if(results){
    //             var parts = [];
    //             for(var i=0;i<results.length;i++){
    //                 var item = results[i];
    //                 parts.push({state: item._id, count: item.count});
    //             }
    //             response.parts = parts;
    //         }
    //         done();
    //     })
    // };

    ah.series([get_asset_info/*, get_part_info*/], function () {
        callback(null, response);
    })
}

module.exports.cmd = cmd.ast_0x00020001;
module.exports.handle = handle;
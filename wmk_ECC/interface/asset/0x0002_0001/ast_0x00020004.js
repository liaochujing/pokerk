/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var AssetAction = require('../../../modules/asset/definition/asset_action');
var db = require('../../../db/index');
var dbAssetLog = db.datadb.astLog;

function handle(req, res, body, callback) {

    var format_month_key = function (year, month) {
        var res = '' + year;
        if(month < 10){
            res+=('0' + month);
        }else{
            res+=month;
        }
        return res;
    };
    var startTime = new Date().GetMonth().AddMonth(-5);

    dbAssetLog.collection.aggregate([
        {$match: {time: {$gte: startTime}, action: AssetAction.maintain}},
        {$group: {
            _id: {
                year: {$year: '$time'},
                month: {$month: '$time'}
            },
            count: {$sum: 1}
        }}
    ], function (err, results) {
        if(err) logger.error(err);
        var dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var key = format_month_key(item._id.year, item._id.month);
                dic[key] = item.count;
            }
        }

        var response = [];
        for(var i=0;i<6;i++){
            var time = startTime.AddMonth(i);
            var key = time.format_month('');
            response.push({month: key, count: dic[key] || 0});
        }

        callback(null, response)
    })
}

module.exports.cmd = cmd.ast_0x00020004;
module.exports.handle = handle;
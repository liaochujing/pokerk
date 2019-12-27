/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var OrderState = require('../../../modules/order/definition/order_state');
var db = require('../../../db/index');
var dbOrder = db.order;
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var now = new Date();
    var startTime = now.GetMonth();
    var endTime = startTime.AddMonth(1);

    dbOrder.find_order({state: {$in: [OrderState.unreceived, OrderState.processing]}, classID: uiclassID.assetOrder, step: {$gte: 2}, 'restData.planTime': {$gte: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, classID: 1, id: 1, fullName: 1, restData: 1}, function (err, results) {
        if(err) logger.error(err);
        var response = [];
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];

                if(item.restData.asset){
                    var aNO = item.restData.asset.aNO;
                    var asset = ramdb.asset.get_asset_sync(aNO);
                    if(asset){
                        response.push({
                            aNO: asset.aNO,
                            type: item.restData.type,
                            planTime: item.restData.planTime,
                            lmDate: asset.lmDate
                        })
                    }
                }
            }
        }
        callback(null, response);
    })
}

module.exports.cmd = cmd.ast_0x00020002;
module.exports.handle = handle;
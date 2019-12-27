/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');
var rdbAsset = db.ramdb.asset;

var AssetState = require('../../../modules/asset/definition/asset_state');

function handle(req, res, body, callback) {
    var response = [];

    var endTime = new Date().AddYear(1);

    var assetDic = rdbAsset.get_all_asset();
    for(var key in assetDic){
        var asset = assetDic[key];

        if(asset.state == AssetState.used){
            var pdDate = asset.pdDate;
            var ucycle = asset.ucycle;

            var ulife = undefined;
            if(pdDate && ucycle != undefined){
                ulife = pdDate.AddYear(ucycle);
            }
            if(ulife && ulife < endTime){
                response.push({
                    aNO: asset.aNO,
                    ucycle: ucycle,//更新周期
                    pdDate: asset.pdDate,//启用日期
                    ulife: ulife//更新年限
                })
            }
        }
    }

    callback(null, response);
}

module.exports.cmd = cmd.ast_0x00020003;
module.exports.handle = handle;
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
var rdbAST = db.ramdb.ast;
var uiclassID = require('../../../definition/uiClassID');

function handle(req, res, body, callback) {
    var _dic = {};
    var assetDic = rdbAsset.get_all_asset();
    for(var key in assetDic){
        var asset = assetDic[key];
        if(asset.region && asset.type){
            var serverNO = asset.region.serverNO;
            var system = asset.type.system;

            var _key = format_key(serverNO, system);
            if(!_dic[_key]){
                _dic[_key] = {serverNO: serverNO, system: system, count: 0};
            }
            _dic[_key].count++;
        }
    }

    var response = [];
    var astList = rdbAST.get_all_asset_type();
    var buildings = db.ramdb.no.get_by_class(uiclassID.building);
    if(buildings){
        for(var i=0;i<buildings.length;i++){
            var building = buildings[i];

            var buildingItem = {
                serverNO: building.serverNO,
                classID: building.classID,
                id: building.id,
                name: building.fullName,
                data: []
            };
            for(var j=0;j<astList.length;j++){
                var ast = astList[j];

                var _key = format_key(building.serverNO, ast.system);
                if(_dic[_key]){
                    buildingItem.data.push({system: ast.system, count: _dic[_key].count});
                }
            }

            response.push(buildingItem);
        }
    }

    callback(null, response);
}

module.exports.cmd = cmd.ast_0x00020010;
module.exports.handle = handle;
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;

var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var response = undefined;

    var device = ramdb.no.get_by_identity(body);

    var dbDP = db.dp;
    var rAsset = ramdb.asset;
    var rdbCNO = ramdb.cno;
    var rdbCNOR = ramdb.cnor;

    if(device){
        var model = undefined;
        var brand = undefined;
        var pdDate = undefined;
        var asset = ramdb.asset.get_asset_sync(device.aNO);
        if(asset){
            model = asset.model;
            brand = asset.brand;
            pdDate = asset.pdDate;
        }

        response = {
            serverNO: device.serverNO,
            classID: device.classID,
            id: device.id,
            name: device.fullName,
            aNO: device.aNO,
            model: model,
            brand: brand,
            pdDate: pdDate,//投产日期
            links: []
        };

        var get_collect_device_path = function (list) {
            var result = [];
            var dic = {};

            for(var i in list){
                var item = list[i];
                
                var cd = ramdb.cno.get_by_identity(item);
                if(cd){
                    var tempList = [{serverNO: cd.serverNO, classID: cd.classID, id: cd.id, name: cd.fullName, cMode: cd.cMode, cOption: cd.cOption}];
                    var _parent = rdbCNOR.get_parent_identity(cd.serverNO, cd.classID, cd.id);
                    while(_parent){
                        var parent = ramdb.cno.get_by_identity(_parent);
                        if(parent){
                            tempList.push({serverNO: parent.serverNO, classID: parent.classID, id: parent.id, name: parent.fullName});
                            _parent = rdbCNOR.get_parent_identity(_parent.serverNO, _parent.classID, _parent.id);
                        }else{
                            break;
                        }
                    }
                    if(_parent){
                        var building = ramdb.no.get_building(_parent.serverNO);
                        if(building){
                            tempList.push({serverNO: building.serverNO, classID: building.classID, id: building.id, name: building.fullName});

                            var park = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(building.serverNO, building.classID, building.id));
                            if(park){
                                tempList.push({serverNO: park.serverNO, classID: park.classID, id: park.id, name: park.fullName});
                            }
                        }
                    }

                    var _parentItem = undefined;
                    for(var j=tempList.length - 1;j >= 0;j--){
                        var item = tempList[j];
                        var _key = format_key(item.serverNO, item.classID, item.id);
                        var pathItem = dic[_key];
                        if(!pathItem){
                            dic[_key] = item;
                            pathItem = dic[_key];
                        }
                        if(!_parentItem){
                            result.push(item);
                        }else{
                            if(!_parentItem.children){
                                _parentItem.children = [];
                            }
                            _parentItem.children.push(item);
                        }
                        _parentItem = item;
                    }
                }
            }

            return result;
        };

        var get_point_info = function (done) {
            dbDP.aggregate([
                {$match: {deviceServerNO: body.serverNO, deviceClassID: body.classID, deviceID: body.id}},
                {$group: {
                    _id: {
                        serverNO: '$binding.serverNO',
                        classID: '$binding.classID',
                        id: '$binding.id'
                    }
                }}
            ], function (err, results) {
                if(err) logger.error(err);

                var list = [];
                for(var i in results){
                    var item = results[i]._id;
                    list.push(item);
                }

                response.path = get_collect_device_path(list);

                done();
            })
        };

        get_point_info(function () {
            callback(null, response);
        });
    }else{
        callback(null, response);
    }
}

module.exports.cmd = cmd.itr_0x00000034;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
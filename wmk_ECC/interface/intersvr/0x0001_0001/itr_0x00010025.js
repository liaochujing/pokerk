/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var ObjectState = require('../../../definition/object_state');
var AssetState = require('../../../modules/asset/definition/asset_state');
var db = require('../../../db/index');
var dbAsset = db.asset;
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var _typeDic = undefined;
    if(body.assetTypes && body.assetTypes.length > 0){
        _typeDic = {};
        for(let i=0;i<body.assetTypes.length;i++){
            let _type = body.assetTypes[i];
            _typeDic[_type] = 1;
        }
    }

    let _areaDic = {};
    function get_areas(identity) {
        _areaDic[format_key(identity.serverNO, identity.classID, identity.id)] = 1;
        let childs = ramdb.nor.get_child_identity_range(identity.serverNO, identity.classID, identity.id, uiclassID.park, uiclassID.room);
        if(childs && childs.length > 0){
            for(let i=0;i<childs.length;i++){
                var child = childs[i];
                get_areas(child);
            }
        }
    }

    for(let k=0;k<body.areas.length;k++){
        get_areas(body.areas[k])
    }

    dbAsset.find_assets({state: {$ne: AssetState.scrap}, _state: {$ne: ObjectState.deleted}}, {_id: 0, aNO: 1, name: 1, type: 1, region: 1, from: 1, ratedPower: 1}, function (err, results) {
        if(err) return callback(err);

        var response = [];
        if(results){
            for(let i=0;i<results.length;i++){
                let asset = results[i];


                let _type = format_key(asset.type.system, asset.type.group);
                if(_typeDic && !_typeDic[_type]){
                    continue;
                }
                let region = asset.region;

                if(region) {
                    let _region = format_key(region.serverNO, region.classID, region.id);
                    if (!_areaDic[_region]) {
                        continue;
                    }

                    var buildingName = undefined;
                    var roomName = undefined;
                    if (region.classID == uiclassID.building) {
                        let building = ramdb.no.get_by_identity(region);
                        if (building) {
                            buildingName = building.fullName;
                        }
                    } else if (region.classID > uiclassID.building) {
                        let building = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(region.serverNO, region.classID, region.id, uiclassID.building));
                        if (building) {
                            buildingName = building.fullName;
                        }
                    }
                    if (region.classID == uiclassID.room) {
                        let room = ramdb.no.get_by_identity(region);
                        if (room) {
                            roomName = room.fullName;
                        }
                    } else if (region.classID > uiclassID.room) {
                        let room = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(region.serverNO, region.classID, region.id, uiclassID.room));
                        if (room) {
                            roomName = room.fullName;
                        }
                    }

                    response.push({
                        building: buildingName,
                        room: roomName,
                        from: asset.from || '',
                        aNO: asset.aNO,
                        name: asset.name,
                        type: asset.type,
                        ratedPower: asset.ratedPower
                    })
                }
            }
        }

        callback(null, response);
    });

}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010025;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        areas: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            },
            required: true
        },
        assetTypes: {
            type: 'array',
            items: {type: 'string'}
        }
    }
};
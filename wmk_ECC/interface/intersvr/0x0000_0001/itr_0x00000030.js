/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {

    var response = [];

    var parks = ramdb.no.get_by_class(uiclassID.park);
    if(parks.length > 0){
        for(var i in parks){
            var park = parks[i];

            var item = {
                serverNO: park.serverNO,
                classID: park.classID,
                id: park.id,
                name: park.fullName,

                coverSize: park.coverSize || 0,
                buildSize: park.buildSize || 0,
                buildings: []
            };

            var buildings = ramdb.nor.get_child_identity(park.serverNO, park.classID, park.id, uiclassID.building);
            if(buildings){
                for(var j in buildings){
                    var building = ramdb.no.get_by_identity(buildings[j]);
                    if(building){
                        item.buildings.push({
                            serverNO: building.serverNO,
                            classID: building.classID,
                            id: building.id,
                            name: building.fullName,

                            coverSize: building.coverSize || 0,
                            buildSize: building.buildSize || 0,

                            ratedFrame: building.ratedFrame || 0,
                            designInput: building.designInput || 0,
                            designCold: building.designCold || 0,
                            designCaifa: building.designCaifa || 0
                        })
                    }
                }
            }

            response.push(item)
        }
    }

    callback(null, response);
}

module.exports.cmd = cmd.itr_0x00000030;
module.exports.handle = handle;
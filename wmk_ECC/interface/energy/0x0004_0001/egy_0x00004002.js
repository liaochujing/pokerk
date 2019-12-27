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
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetDate().AddDays(-7);
    var endTime = new Date().GetDate();

    var park = ramdb.no.get_by_identity(body);
    if(!park){
        callback({status: code.not_found, msg: 'park not found'});
        return;
    }

    var response = {
        serverNO: park.serverNO,
        classID: park.classID,
        id: park.id,
        name: park.fullName,
        dayList: [],
        pueList: [],
        plfList: [],
        clfList: [],
        alfList: [],
        buildings: []
    };

    var areas = [{serverNO: park.serverNO, classID: park.classID, id: park.id}];
    var buildings = ramdb.nor.get_child_identity(park.serverNO, park.classID, park.id, uiclassID.building);
    if(buildings && buildings.length > 0){
        for(var i=0;i<buildings.length;i++){
            var _building = buildings[i];
            areas.push({serverNO: _building.serverNO, classID: _building.classID, id: _building.id})
        }
    }
    datadb.amday.query({$or: areas, time: {$gte: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, id: 1, day: 1, pue: 1, plf: 1, clf: 1, alf: 1}, function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i in results){
                var item = results[i];

                if(!dic[item.day]){
                    dic[item.day] = {};
                }
                if(!dic[item.day][item.serverNO]){
                    dic[item.day][item.serverNO] = {};
                }
                if(!dic[item.day][item.serverNO][item.id]){
                    dic[item.day][item.serverNO][item.id] = item;
                }
            }
        }

        for(var i in dic){
            response.dayList.push(i);

            var dayItem = dic[i];
            var _pItem = undefined;
            if(dayItem[park.serverNO]){
                _pItem = dayItem[park.serverNO][park.id]
            }
            if(_pItem){
                response.pueList.push(_pItem.pue || 0);
                response.plfList.push(_pItem.plf || 0);
                response.clfList.push(_pItem.clf || 0);
                response.alfList.push(_pItem.alf || 0);
            }else{
                response.pueList.push(0);
                response.plfList.push(0);
                response.clfList.push(0);
                response.alfList.push(0);
            }
        }

        if(buildings){
            for(var i=0;i<buildings.length;i++){
                var building = ramdb.no.get_by_identity(buildings[i]);
                if(building){
                    var item = {
                        serverNO: building.serverNO,
                        classID: building.classID,
                        id: building.id,
                        name: building.fullName,
                        pueList: [],
                        plfList: [],
                        clfList: [],
                        alfList: []
                    };

                    for(var k in dic){
                        var dayItem = dic[k];

                        var _bItem = undefined;
                        if(dayItem[building.serverNO]){
                            _bItem = dayItem[building.serverNO][building.id]
                        }
                        if(_bItem){
                            item.pueList.push(_bItem.pue || 0);
                            item.plfList.push(_bItem.plf || 0);
                            item.clfList.push(_bItem.clf || 0);
                            item.alfList.push(_bItem.alf || 0);
                        }else{
                            item.pueList.push(0);
                            item.plfList.push(0);
                            item.clfList.push(0);
                            item.alfList.push(0);
                        }
                    }

                    response.buildings.push(item);
                }
            }
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00004002;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'integer', required: true},
        classID: {type: 'integer', required: true},
        id: {type: 'integer', required: true}
    }
};
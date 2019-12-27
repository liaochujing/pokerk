/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');
var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = [];

    var startTime = new Date().GetMonth();
    var endTime = new Date();

    var match = {};
    switch(body.classID){
        case uiclassID.park:
            break;
        case uiclassID.building:
            match.serverNO = body.serverNO;
            match.classID = body.classID;
            match.id = body.id;
            break;
        default:
            callback(null, response);
            return;
            break;
    }
    match.time = {$gte: startTime, $lt: endTime};

    datadb.amdata.aggregate([
        {$match: match},
        {$group: {
            _id: {
                serverNO: '$serverNO',
                classID: '$classID',
                id: '$id'
            },
            start: {$first: '$energy'},
            end: {$last: '$energy'}
        }}
    ], function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var serverNO = item._id.serverNO;
                var id = item._id.id;
                if(!dic[serverNO]){
                    dic[serverNO] = {}
                }
                dic[serverNO][id] = item;
            }
        }

        var buildings = undefined;
        switch(body.classID){
            case uiclassID.park:
                buildings = ramdb.nor.get_child_identity(body.serverNO, body.classID, body.id, uiclassID.building) || [];
                break;
            case uiclassID.building:
                buildings = [body];
                break;
            default:
                buildings = [];
                break;
        }
        for(var i=0;i<buildings.length;i++){
            var building = ramdb.no.get_by_identity(buildings[i]);
            if(!building){
                continue;
            }

            var energy = 0;
            var dataItem = undefined;
            if(dic[building.serverNO]){
                dataItem = dic[building.serverNO][building.id];
            }

            if(dataItem){
                var data = realTimeProcessor.get_area_data_cache(building);
                if(data){
                    if(data.energy){
                        energy = data.energy;
                        energy-=(dataItem.start || 0);
                    }
                }else{
                    energy = (dataItem.end || 0) - (dataItem.start || 0)
                }
            }

            response.push({name: building.fullName, value: format_value(energy)});
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00001039;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
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

    var response = {};

    var building = ramdb.no.get_by_identity(body);

    if(building){
        response.coverSize = building.coverSize || 0;
        response.buildSize = building.buildSize || 0;

        response.ratedFrame = building.ratedFrame || 0;
        response.designInput = building.designInput || 0;
        response.designCold = building.designCold || 0;
        response.designCaifa = building.designCaifa || 0;
    }

    callback(null, response);
}

module.exports.cmd = cmd.itr_0x00000031;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
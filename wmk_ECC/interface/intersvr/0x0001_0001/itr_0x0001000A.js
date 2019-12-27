/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db');
var version = require('../../../config/version');

var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');

function handle(req, res, body, callback) {
    var msg = new DataMessage(CentralCMD.cen_0x0000000A);
    dataHelper.send(msg, function (err, data) {
        if(err){
            logger.error({msg: 'get building system info failed', err: err});
        }

        var response = {
            version: version,
            buildings: []
        };
        if(data){
            for(var i=0;i<data.length;i++){
                var item = data[i];
                var building = db.ramdb.no.get_by_identity(item);
                if(building){
                    item.name = building.fullName;
                }
                response.buildings.push(item);
            }
        }

        callback(null, response)
    });
}

module.exports.cmd = cmd.itr_0x0000000A;
module.exports.handle = handle;
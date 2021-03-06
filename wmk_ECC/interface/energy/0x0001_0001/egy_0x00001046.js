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

var areaHelper = require('../../../helpers/area_helper');
var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = [];

    var dic = {};
    var hvdcList = areaHelper.get_child_identity_list(body.serverNO, body.classID, body.id, uiclassID.HVDC_List);
    ah.each_series(hvdcList, function (identity, cbItem) {
        var hvdc = ramdb.no.get_by_identity(identity);
        if(!hvdc){
            cbItem();
            return;
        }
        var data = realTimeProcessor.get_device_data_cache(hvdc);
        if(data){
            var load = 0;
            var ratedElec = hvdc.ratedElec;

            if(data.out_elec && ratedElec){
                load = data.out_elec / ratedElec;
            }

            dic[hvdc.id] = load
        }

        cbItem();
    }, function () {

        for(var i in hvdcList){
            var hvdc = ramdb.no.get_by_identity(hvdcList[i]);
            if(hvdc){
                response.push({
                    serverNO: hvdc.serverNO,
                    classID: hvdc.classID,
                    id: hvdc.id,
                    name: hvdc.fullName,
                    value: format_value(dic[hvdc.id] || 0)
                })
            }
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00001046;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
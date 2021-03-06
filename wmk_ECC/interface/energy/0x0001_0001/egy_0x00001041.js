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
    var upsList = areaHelper.get_child_identity_list(body.serverNO, body.classID, body.id, uiclassID.UPS_List);
    ah.each_series(upsList, function (identity, cbItem) {
        var ups = ramdb.no.get_by_identity(identity);
        if(!ups){
            cbItem();
            return;
        }
        var data = realTimeProcessor.get_device_data_cache(ups);

        if(data){
            var load = 0;
            var ratedElec = ups.ratedElec;

            var max_out_elec = 0;
            if(data.out_elec_a && data.out_elec_a > max_out_elec){
                max_out_elec = data.out_elec_a;
            }
            if(data.out_elec_b && data.out_elec_b > max_out_elec){
                max_out_elec = data.out_elec_b;
            }
            if(data.out_elec_c && data.out_elec_c > max_out_elec){
                max_out_elec = data.out_elec_c;
            }
            if(max_out_elec && ratedElec){
                load = max_out_elec / ratedElec;
            }

            dic[ups.id] = load
        }

        cbItem();
    }, function () {

        for(var i in upsList){
            var ups = ramdb.no.get_by_identity(upsList[i]);
            if(ups){
                response.push({
                    serverNO: ups.serverNO,
                    classID: ups.classID,
                    id: ups.id,
                    name: ups.fullName,
                    value: format_value(dic[ups.id] || 0)
                })
            }
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00001041;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
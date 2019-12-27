/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');

var EnergySystem = require('../../../modules/energy/definition/energy_system');

function handle(req, res, body, callback) {
    var response = {
        power: 0,
        pw_it: 0,
        pw_power: 0,
        pw_cold: 0,
        pw_other: 0,
        pue: 0,
        plf: 0,
        clf: 0,
        alf: 0
    };

    function get_static_info(done) {
        var data = realTimeProcessor.get_area_data_cache(body);
        if(data){
            response.power = data.power;
            response.pue = data.pue || 0;
            response.plf = data.plf || 0;
            response.clf = data.clf || 0;
            response.alf = data.alf || 0;
        }

        done();
    }

    function get_system_info(done) {
        var data = realTimeProcessor.get_system_data_cache(body, EnergySystem.it);
        if(data){
            response.pw_it = data.power;
        }
        var data = realTimeProcessor.get_system_data_cache(body, EnergySystem.power);
        if(data){
            response.pw_power = data.power;
        }
        var data = realTimeProcessor.get_system_data_cache(body, EnergySystem.cold);
        if(data){
            response.pw_cold = data.power;
        }
        var data = realTimeProcessor.get_system_data_cache(body, EnergySystem.other);
        if(data){
            response.pw_other = data.power;
        }

        done();
    }

    ah.series([get_static_info, get_system_info], function () {
        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x00001001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
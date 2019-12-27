/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var DefinitionHelper = require('../../../modules/energy/definition/definition_helper');
var EnergySystem = require('../../../modules/energy/definition/energy_system');

var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');

var db = require('../../../db/index');
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = [];

    var startTime = new Date().GetDate().AddDays(-1);
    var endTime = new Date().GetDate();

    // function get_project_info(done) {
    //     datadb.amdata.aggregate([
    //         {$match: {serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}},
    //         {$group: {
    //             _id: '',
    //             energy: {$last: '$energy'}
    //         }}
    //     ], function (err, data) {
    //         if(err) logger.error(err);
    //
    //         var yesValue = 0;
    //         if(data && data.length > 0){
    //             yesValue = data[0].energy;
    //         }
    //
    //         var data = realTimeProcessor.get_area_data_cache(body);
    //
    //         var value = 0;
    //         if(data){
    //             value = data.energy;
    //         }
    //         if(value){
    //             value = value - yesValue;
    //         }
    //         if(value < 0){
    //             value = 0;
    //         }
    //
    //         response.push({value: format_value(value), name: '总能耗'});
    //         done();
    //     });
    // }

    function get_system_info(done) {
        datadb.stdata.aggregate([
            {$match: {serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}},
            {$group: {
                _id: '$system',
                energy: {$last: '$energy'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            var yes_it = 0;
            var yes_cold = 0;
            var yes_power = 0;
            var yes_other = 0;
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    switch (item._id){
                        case EnergySystem.it:
                            yes_it = item.energy;
                            break;
                        case EnergySystem.cold:
                            yes_cold = item.energy;
                            break;
                        case EnergySystem.power:
                            yes_power = item.energy;
                            break;
                        case EnergySystem.other:
                            yes_other = item.energy;
                            break;
                    }
                }
            }

            var it = 0;
            var cold = 0;
            var power = 0;
            var other = 0;

            var data = realTimeProcessor.get_system_data_cache(body, EnergySystem.it);
            if(data){
                it = data.energy - yes_it;
            }
            var data = realTimeProcessor.get_system_data_cache(body, EnergySystem.power);
            if(data){
                power = data.energy - yes_power;
            }
            var data = realTimeProcessor.get_system_data_cache(body, EnergySystem.cold);
            if(data){
                cold = data.energy - yes_cold;
            }
            var data = realTimeProcessor.get_system_data_cache(body, EnergySystem.other);
            if(data) {
                other = data.energy - yes_other;
            }

            response.push({value: format_value(it), name: DefinitionHelper.get_system_name(EnergySystem.it)});
            response.push({value: format_value(power), name: DefinitionHelper.get_system_name(EnergySystem.power)});
            response.push({value: format_value(cold), name: DefinitionHelper.get_system_name(EnergySystem.cold)});
            response.push({value: format_value(other), name: DefinitionHelper.get_system_name(EnergySystem.other)});

            done();
        });
    }

    ah.series([/*get_project_info, */get_system_info], function () {
        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x00001006;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
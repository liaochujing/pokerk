/**
 * Created by wangxh on 2018/1/31.
 */

'use strict';

var EnergySystem = require('./energy_system');
var ITSystem = require('./it_system');
var ColdSystem = require('./cold_system');
var PowerSystem = require('./power_system');
var OtherSystem = require('./other_system');

function get_system_name(system) {
    switch(system){
        case EnergySystem.it:
            return 'IT系统';
        case EnergySystem.cold:
            return '制冷系统';
        case EnergySystem.power:
            return '电源系统';
        case EnergySystem.other:
            return '辅助系统';
    }
}

function get_it_system_name(system) {
    switch(system){
        case ITSystem.room:
            return '数据机房';
    }
}

function get_power_system_name(system) {
    switch(system){
        case PowerSystem.transformer:
            return '变压器';
        case PowerSystem.ups:
            return 'UPS';
        case PowerSystem.hvdc:
            return 'HVDC';
        case PowerSystem.lowPressure:
            return '-48V';
    }
}

function get_cold_system_name(system) {
    switch(system){
        case ColdSystem.airCondition:
            return '末端空调';
        case ColdSystem.coldWater:
            return '冷水机组';
        case ColdSystem.primaryPump:
            return '冷冻一次泵';
        case ColdSystem.twoPump:
            return '冷冻二次泵';
        case ColdSystem.pump:
            return '冷却泵';
        case ColdSystem.coolingTower:
            return '冷却塔';
        case ColdSystem.ljac:
            return '列间空调';
        case ColdSystem.ahu:
            return 'AHU';
        case ColdSystem.dxac:
            return 'DX空调';
        case ColdSystem.waterTreatment:
            return '水处理'
    }
}

function get_other_system_name(system) {
    switch(system){
        case OtherSystem.fireControl:
            return '消防';
        case OtherSystem.lighting:
            return '照明';
        case OtherSystem.monitoring:
            return '弱电监控';
        case OtherSystem.other:
            return '其他';
        case OtherSystem.elecTracing:
            return '电伴热';
    }
}

module.exports.get_system_name = get_system_name;
module.exports.get_it_system_name = get_it_system_name;
module.exports.get_power_system_name = get_power_system_name;
module.exports.get_cold_system_name = get_cold_system_name;
module.exports.get_other_system_name = get_other_system_name;
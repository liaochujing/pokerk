/**
 * Created by wangxh on 2017/11/22.
 */
'use strict';

var util = require('util');
var ah = require('../../util/array_helper');
var logger = require('../../util/log_manager').logger;

const models = {};

module.exports = models;

module.exports.init = function (param, callback) {
    var init_array = [];
    
    if(param.cache){
        for(var i in param.cache){
            var item = param.cache[i];
            var _model = undefined;
            var _param = undefined;
            if(typeof item == 'string'){
                _model = item;
            }else{
                _model = item.name;
                _param = item.param;
            }
            if(_model){
                init_array.push({model: _model, param: _param});
            }else{
                logger.warn('table %s not found', item);
            }
        }
    }

    for(var i=0;i<init_array.length;i++){
        var item = init_array[i];

        var key = item.model;
        var model = undefined;
        switch(key){
            case 'cfg':
                model = require('./base/system_config');
                break;
            case 'oo':
                model = require('./user/operator_object');
                break;
            case 'oor':
                model = require('./user/operator_relation');
                break;
            case 'role':
                model = require('./user/role');
                break;

            case 'privilege':
                model = require('./base/privilege');
                break;
            case 'no':
                model = require('./base/nameobject');
                break;
            case 'nor':
                model = require('./base/relation');
                break;
            case 'dp':
                model = require('./base/devicepoint');
                break;
            case 'dep':
                model = require('./base/device_type');
                break;

            case 'alarm':
                model = require('./alarm/alarm');
                break;
            case 'alp':
                model = require('./alarm/alarm_type');
                break;

            case 'cno':
                model = require('./collect/collect_object');
                break;
            case 'cnor':
                model = require('./collect/collect_relation');
                break;
            case 'cdt':
                model = require('./collect/collect_device_type');
                break;

            case 'order':
                model = require('./order/order');
                break;
            case 'inspection_data':
                model = require('./order/inspection_data');
                break;
            case 'asset':
                model = require('./asset/asset');
                break;
            case 'ast':
                model = require('./asset/asset_type');
                break;
            case 'pst':
                model = require('./asset/parts_type');
                break;
            case 'lc':
                model = require('./base/link_control');
                break;
            default:
                logger.error('unknown ram table :%s', key);
                break;
        }

        if(model){
            models[key] = new model();
        }else{
            logger.error('unknown ram table :%s', key);
        }
    }

    ah.each(init_array, function (item, cbItem) {
        var model = models[item.model];
        logger.debug('start init next table:%s',model.tb_name);
        model.init(item.param, function (err) {
            if (err) {
                logger.error({msg: 'init ramdb failed', table: model.tb_name, err: err});
                cbItem(err);
                return;
            }
            logger.debug('init table:%s finished',model.tb_name);
            cbItem();
        });
    }, function (err) {
        if(err){
            callback(err);
        }else{
            logger.info('init ramdb finished');
            callback();
        }
    });
};
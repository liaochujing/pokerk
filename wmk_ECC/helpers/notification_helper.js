/**
 * Created by wangxh on 2017/4/1.
 */

'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var logger = require('../util/log_manager').logger;

const Emitter = {
    alarm: 'alarm',
    data_service: 'data_service',
    notify_service: 'notify_service',
    collector: 'collector',
    link_control: 'link_control',
    config: 'config',
};

var _emitters = {};

function on(emitter, event, callback) {
    var eventer = _emitters[emitter];
    if(!eventer){
        eventer = new EventEmitter();
        _emitters[emitter] = eventer;
    }
    eventer.on(event, callback);
}

function emit(emitter, event, opt){
    var eventer = _emitters[emitter];
    if(eventer){
        switch(arguments.length){
            case 3:
                eventer.emit(event, arguments[2]);
                break;
            case 4:
                eventer.emit(event, arguments[2], arguments[3]);
                break;
            case 5:
                eventer.emit(event, arguments[2], arguments[3], arguments[4]);
                break;
            default:
                var args = [event].concat(arguments.splice(2));
                eventer.apply(null, args);
                break;
        }
    }else{
        logger.info('when emit: emitter: %s event: %s, target not found', emitter, event);
    }
}

module.exports.Emitter = Emitter;
module.exports.on = on;
module.exports.emit = emit;
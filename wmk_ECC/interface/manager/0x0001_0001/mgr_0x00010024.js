/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var jsonSchema = require('json-schema');
var notification = require('../../../helpers/notification_helper');
var db = require('../../../db/index');


let schema1 = {
    type: 'object',
    properties: {
        Dt: {type: 'number', required: true},
        Kp: {type: 'number', required: true},
        Ki: {type: 'number', required: true},
        Kd: {type: 'number', required: true},
        max_out: {type: 'number', required: true},
        min_out: {type: 'number', required: true},
        max_get_pm_retry_times: {type: 'number', required: true},
        control_level: {type: 'number', required: true},
        target: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    points: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                serverNO: {type: 'number', required: true},
                                classID: {type: 'number', required: true},
                                id: {type: 'number', required: true},
                                pointIndex: {type: 'number', required: true}
                            }
                        },
                        required: true
                    },
                    key: {type: 'string', required: true}
                }
            },
            required: true
        },
        set_point: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true},
                    pointIndex: {type: 'number', required: true},
                    group: {type: 'number', required: true},
                    lock: {type: 'number'} //锁定状态 0 解锁 1 锁定
                },
                required: true
            },
            required: true
        },
        control_time_out: {type: 'number', required: true},
        control_retry_times: {type: 'number', required: true},
        control_retry_interval: {type: 'number', required: true}
    },
    required: true
};

let schema2 = {
    type: 'object',
    properties: {
        time_line: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    time: {type: 'integer', required: true},
                    name: {type: 'string'},
                    points: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                serverNO: {type: 'integer', required: true},
                                classID: {type: 'integer', required: true},
                                id: {type: 'integer', required: true},
                                pointIndex: {type: 'integer', required: true},
                            }
                        },
                        required: true
                    }
                }
            },
            required: true
        }
    },
    required: true
};

function handle(req, res, body, callback) {
    switch(body.type){
        case 1:
            var _res = jsonSchema.validate(req.body.option, schema1);
            if(!_res.valid){
                callback({status: code.param_error, message: _res.errors});
                return;
            }
            break;
        case 2:
            var _res = jsonSchema.validate(req.body.option, schema2);
            if(!_res.valid){
                callback({status: code.param_error, message: _res.errors});
                return;
            }
            break;
        default:
            break;
    }

    var dbLC = db.lc;

    var now = new Date();
    dbLC.update_link_control(body.id, body.type, body.name, body.option, body.enabled, now, function (err) {
        if(err) return callback(err);

        var _lc = {
            id: body.id,
            type: body.type,
            name: body.name,
            option: body.option,
            enabled: body.enabled,
            time:now
        };
        db.ramdb.lc.set_link_control(_lc);
        notification.emit(notification.Emitter.link_control, 'set', _lc);

        callback();
    })
}

module.exports.cmd = cmd.mgr_0x00010024;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'integer', required: true},
        type: {type: 'integer', required: true},
        name: {type: 'string', required: true},
        option: {
            type: 'object',
            // properties: {
            //     Dt: {type: 'number', required: true},
            //     Kp: {type: 'number', required: true},
            //     Ki: {type: 'number', required: true},
            //     Kd: {type: 'number', required: true},
            //     max_out: {type: 'number', required: true},
            //     min_out: {type: 'number', required: true},
            //     max_get_pm_retry_times: {type: 'number', required: true},
            //     control_level: {type: 'number', required: true},
            //     target: {
            //         type: 'array',
            //         items: {
            //             type: 'object',
            //             properties: {
            //                 point: {
            //                     type: 'object',
            //                     properties: {
            //                         serverNO: {type: 'number', required: true},
            //                         classID: {type: 'number', required: true},
            //                         id: {type: 'number', required: true},
            //                         pointIndex: {type: 'number', required: true}
            //                     },
            //                     required: true
            //                 },
            //                 key: {type: 'string', required: true}
            //             }
            //         },
            //         required: true
            //     },
            //     set_point: {
            //         type: 'array',
            //         items: {
            //             type: 'object',
            //             properties: {
            //                 serverNO: {type: 'number', required: true},
            //                 classID: {type: 'number', required: true},
            //                 id: {type: 'number', required: true},
            //                 pointIndex: {type: 'number', required: true}
            //             },
            //             required: true
            //         },
            //         required: true
            //     },
            //     control_time_out: {type: 'number', required: true},
            //     control_retry_times: {type: 'number', required: true},
            //     control_retry_interval: {type: 'number', required: true}
            // },
            required: true
        },
        enabled: {type: 'integer', enum: [0, 1], required: true}
    }
};
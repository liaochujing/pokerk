/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var area_helper = require('../../../helpers/area_helper');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var user = req.user;

    var dbAlarm = db.alarm;
    var ramdb = db.ramdb;

    var query = {};

    if(body.area){
        var area = body.area;
        if(area.classID == uiclassID.park){
            var buildings = db.ramdb.nor.get_child_identity(area.serverNO, area.classID, area.id, uiclassID.building);
            var mNOS = [area.serverNO];
            for(var i in buildings){
                var item = buildings[i];
                mNOS.push(item.serverNO);
            }
            query.serverNO = {$in: mNOS};
        }else if(area.classID == uiclassID.building){
            query.serverNO = area.serverNO;
        }else{
            var idList = [area.id];

            var areaList = area_helper.get_all_child(area, [uiclassID.building, uiclassID.floor, uiclassID.room])//db.ramdb.nor.get_child_identity_list(area.serverNO, area.classID, area.id, [uiclassID.building, uiclassID.floor, uiclassID.room]);
            if(areaList){
                for(var i in areaList){
                    idList.push(areaList[i].id);
                }
            }
            query.serverNO = area.serverNO;
            query.area = {$in: idList};
        }
    }
    if(body.source){
        query['source.serverNO'] = body.source.serverNO;
        query['source.classID'] = body.source.classID;
        query['source.id'] = body.source.id;
    }
    if(body.type != undefined){
        query.type = body.type;
    }

    if(body.time){
        var _time = new Date(body.time);
        query.startTime = {$lt: _time};
    }

    var response = undefined;
    var last_time = undefined;
    var get_main = function (done) {
        dbAlarm.aggregate([{$match: query}, {$sort: {startTime: -1}}, {$limit: body.limit}, {$project: {
            _id: 0,
            i: ['$serverNO', '$classID', '$id', '$desc', '$level', '$startTime'],
            c: '$isConfirmed',
            et: '$endTime',//结束时间
            ft: '$force.time',//强制结束时间
            h: '$isHangup',//是否挂起
            p: '$parent',//收敛
            o: '$order',//工单
            s: '$star.' + user.id//星标
        }}], function (err, data) {
            if(err) return callback({status: code.unknown});
            // if(data){
            //     for(var i=data.length - 1;i>=0;i--){
            //         var item = data[i];
            //         item.i[5] = item.i[5].getTime();
            //         if(item.et){
            //             item.et = item.et.to_unix();
            //         }
            //         if(item.ft){
            //             item.ft = item.ft.to_unix();
            //         }
            //     }
            // }
            response = data;

            done();
        });
    };

    var get_ext = function (done) {
        if(response && response.length >= body.limit){
            last_time = response[response.length - 1].i[5];
            query.startTime = last_time;
            var time_interval = last_time.getTime();

            dbAlarm.aggregate([{$match: query}, {$project: {
                _id: 0,
                i: ['$serverNO', //告警serverNO
                    '$classID', //告警classID
                    '$id',//告警id
                    '$desc', //描述
                    '$level', //等级
                    '$startTime'//开始时间
                ],
                c: '$isConfirmed',//是否确认
                et: '$endTime',//结束时间
                ft: '$force.time',//强制结束时间
                h: '$isHangup',//是否挂起
                p: '$parent',//收敛
                o: '$order',//工单
                s: '$star.' + user.id//星标
            }}], function (err, data) {
                if(err) return callback({status: code.unknown});
                var _index = response.length - 1;
                for(var i=response.length-1;i>=0;i--){
                    var item = response[i];
                    if(item.i[5].getTime() != time_interval){
                        break;
                    }
                    _index = i;
                }

                response.splice(_index, response.length - _index);
                if(data){
                    response = response.concat(data);
                }

                for(var i=response.length - 1;i>=0;i--){
                    var item = response[i];
                    var st = item.i[5];
                    if(st){
                        item.i[5] = st.to_unix();
                    }
                    if(item.et){
                        item.et = item.et.to_unix();
                    }
                    if(item.ft){
                        item.ft = item.ft.to_unix();
                    }
                }

                done();
            });
        }else{
            for(var i=response.length - 1;i>=0;i--){
                var item = response[i];
                item.i[5] = item.i[5].to_unix();
                if(item.et){
                    item.et = item.et.to_unix();
                }
                if(item.ft){
                    item.ft = item.ft.to_unix();
                }
            }

            done();
        }
    };
    
    get_main(function () {
        get_ext(function () {
            callback(null, {list: response, time: last_time});
        })
    })
}

module.exports.cmd = cmd.alm_0x00020007;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        area: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            }
        },
        source: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            }
        },
        type: {type: 'number'},
        time: {type: 'string'},
        limit: {type: 'number', minimum: 500, required: true}
    }
};
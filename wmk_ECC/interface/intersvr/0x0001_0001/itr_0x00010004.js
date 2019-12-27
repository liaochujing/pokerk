/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var PrivilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');
var rdbOO = db.ramdb.oo;

module.exports.privilege = PrivilegePoint.queryReport;
function handle(req, res, body, callback) {
    var ramdb = db.ramdb;
    var rno = ramdb.no;
    var rnor = ramdb.nor;
    var rdep = ramdb.dep;
    var rAsset = ramdb.asset;
    logger.info('*********body: ',body);
    var query = {};
    var source_list = [];
    // var _parent_dic = {};
    // var root = body.root;
    if (body.areas && body.areas.length > 0 ){
        for (var i = 0; i < body.areas.length; i++){
            var obj = body.areas[i];
            get_device_list(obj);
            // get_parent_list(obj);
        }
    }

    function get_device_list(name_obj) {   //添加本身以及下级设备
        source_list.push({'source.serverNO':name_obj.serverNO,'source.classID':name_obj.classID,'source.id':name_obj.id});
        var children = rnor.get_child_identity(name_obj.serverNO,name_obj.classID,name_obj.id);
        if (children && children.length> 0){
            for (var j = 0; j < children.length; j ++){
                if (children[j].classID>= uiclassID.alarmPoint && children[j].classID <= uiclassID.lastDevice){
                    get_device_list(children[j]);
                }
            }
        }
    }
    // logger.info('souce_list for alarm searching: ',source_list);
    query['$and'] = [];
    var query_source = {};
    query_source['$or'] = source_list;
    // logger.info('query_source************: ',query_source);
    query['$and'].push(query_source);
    // 如果需要从子对象获取上级报警
    // function get_parent_list(name_obj){
    //      var parent = nor.get_parent_identity(name_obj.serverNO,name_obj.classID,name_obj.id);
    //      if (parent){
    //          if (!_parent_dic[parent.serverNO]){
    //              _parent_dic[parent.serverNO] = {};
    //              _parent_dic[parent.serverNO][parent.id] = parent;
    //              source_list.push({'source.serverNO':parent.serverNO,'source.classID':parent.classID,'source.id':parent.id})
    //          }
    //          else if (!_parent_dic[parent.serverNO][parent.id]){
    //              _parent_dic[parent.serverNO][parent.id] = parent;
    //              source_list.push({'source.serverNO':parent.serverNO,'source.classID':parent.classID,'source.id':parent.id})
    //          }
    //          else{
    //              return;
    //          }
    //          if (parent.serverNO == root.serverNO && parent.id == root.id){
    //              return;
    //          }
    //          get_parent_list(parent);
    //      }
    // }


    // if(body.areas){
    //     var _areas = [];
    //     for(var i=0;i<body.areas.length;i++){
    //         var area = body.areas[i];
    //
    //         if(area.classID == uiclassID.park){
    //             var buildings = db.ramdb.nor.get_child_identity(area.serverNO, area.classID, area.id, uiclassID.building);
    //             var mNOS = [area.serverNO];
    //             for(var j in buildings){
    //                 var item = buildings[j];
    //                 mNOS.push(item.serverNO);
    //             }
    //             _areas.push({serverNO: {$in: mNOS}});
    //         }else if(area.classID == uiclassID.building){
    //             _areas.push({serverNO: area.serverNO});
    //         }else{
    //             var idList = [area.id];
    //
    //             var areaList = db.ramdb.nor.get_child_identity_area(area.serverNO, area.classID, area.id);
    //             if(areaList){
    //                 for(var j in areaList){
    //                     idList.push(areaList[j].id);
    //                 }
    //             }
    //             _areas.push({serverNO: area.serverNO, area: {$in: idList}});
    //         }       //_areas = [{serverNO:{$in:[area_serverNo_list]}}]
    //     }
    //     query['$or'] = _areas;   //serverNO list
    // }


    if(body.deviceClassID && body.deviceClassID.length > 0){ //
        var query_class = {};
        query_class['source.classID'] = {$in: body.deviceClassID};
        query['$and'].push(query_class);
        // logger.info('query_class************: ', query_class)
    }
    if(body.alarmClassID != undefined && body.alarmClassID.length > 0){
        var query_alarm_class = {};
        query_alarm_class.classID = {$in: body.alarmClassID};
        query['$and'].push(query_alarm_class);
        // logger.info('alarm_class************: ',query_alarm_class)
    }
    if(body.levels != undefined && body.levels.length > 0){
        var query_level = {};
        query_level.level = {$in: body.levels};
        query['$and'].push(query_level);
    }
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);
    var query_time = {};
    query_time.startTime = {$gte: startTime, $lt: endTime};
    // logger.info('query_time************: ',query_time);
    query['$and'].push(query_time);
    var actions = body.actions;

    if (actions['confirm'] || actions['force']|| actions['hangup'] || actions['unhangup']){
        var query_action = {};
        var _actions_list = [];
        // action_filter = {};
        if (actions['confirm']){
            _actions_list.push({isConfirmed:1})
        }
        if (actions['force']){
            _actions_list.push({isForce:1})
        }
        if (actions['hangup']){
            _actions_list.push({isHangup:1})
        }
        if (actions['unhangup']){
            _actions_list.push({isHangup:0})
        }
        query_action['$or'] = _actions_list;
        query['$and'].push(query_action);
        // logger.info('action_list************: ',_actions_list)
    }



    var _alarms = [];
    var get_alarm = function (done) {
        db.alarm.find_alarm(query, {_id: 0}, function (err, alarms) {
            if(err) return done(err);

            if(alarms){
                _alarms = _alarms.concat(alarms);
            }

            done();
        });
    };

    var get_his_alarm = function (done) {
        db.datadb.hisalarm.find_his_alarm(query, {_id: 0}, function (err, alarms) {
            if(err) return done(err);

            if(alarms){
                _alarms = _alarms.concat(alarms);
            }
            done();
        });
    };
    // logger.info('query for alarm report***********\n: ',JSON.stringify(query));
    ah.series([get_alarm, get_his_alarm], function (err) {
        if(err) return callback(err);

        _alarms.sort(function (item1, item2) {
            if(item1.startTime > item2.startTime){
                return 1
            }else if(item1.startTime == item2.startTime){
                return 0;
            }else{
                return -1;
            }
        });

        logger.info('_alarms list from database: ',_alarms);
        var response = [];
        for(var i=0;i<_alarms.length;i++){
            var record = _alarms[i];
            var source = record.source;


            var roomName = undefined;
            var _room = rnor.get_parent_identity(source.serverNO, source.classID, source.id, uiclassID.room);
            if(_room){
                var obj = rno.get_by_identity(_room);
                if(obj){
                    roomName = obj.fullName;
                }
            }

            var deviceName = undefined;
            var pointName = undefined;
            var model = undefined;
            var brand = undefined;
            var device = rno.get_no_sync(source.serverNO, source.classID, source.id);

            if(device){
                deviceName = device.fullName;
                var asset = rAsset.get_asset_sync(device.aNO);
                if(asset){
                    model = asset.model;
                    brand = asset.brand;
                }
                if(source.pointIndex != undefined){
                    var point = rdep.get_device_type_point(device.type, source.pointIndex);
                    if(point){
                        pointName = point.name;
                    }
                }
            }

            var cfu = undefined;
            var cft = undefined;
            var cfr = undefined;
            if(record.confirmed){
                var _user = rdbOO.get_operator_by_id(record.confirmed.user);
                if(_user){
                    cfu = _user.fullName;
                }
                cft = record.confirmed.time;
                cfr = record.confirmed.reason;
            }

            var feu = undefined;
            var fet = undefined;
            var fer = undefined;
            if(record.force){
                var _user = rdbOO.get_operator_by_id(record.force.user);
                if(_user){
                    feu = _user.fullName;
                }
                fet = record.force.time;
                fer = record.force.reason;
            }

            var hau = undefined;
            var hat = undefined;
            var har = undefined;
            if(record.hangup){
                var _user = rdbOO.get_operator_by_id(record.hangup.user);
                if(_user){
                    hau = _user.fullName;
                }
                hat = record.hangup.time;
                har = record.hangup.reason;
            }

            var uhu = undefined;
            var uht = undefined;
            var uhr = undefined;
            if(record.unhangup){
                var _user = rdbOO.get_operator_by_id(record.unhangup.user);
                if(_user){
                    uhu = _user.fullName;
                }
                uht = record.unhangup.time;
                uhr = record.unhangup.reason;
            }

            var item = {
                serverNO: record.serverNO,
                id: record.id,
                room: roomName,
                deviceClassID: source.classID,
                device: deviceName,
                model: model,
                brand: brand,
                point: pointName || '',
                value: record.start ? record.start.pointValue : undefined,
                level: record.level,
                startTime: record.startTime,
                endTime: record.endTime,
                desc: record.desc,

                cfu: cfu,//确认人
                cft: cft,//确认时间
                cfr: cfr,//确认原因
                feu: feu,//强制结束人
                fet: fet,//时间
                fer: fer,//原因
                hau: hau,//挂起人
                hat: hat,//时间
                har: har,//原因
                uhu: uhu,//解挂人
                uht: uht,//时间
                uhr: uhr,//原因
            };

            response.push(item);
        }
        // logger.info('res: ',response);
        callback(null, response)
    })
}

module.exports.cmd = cmd.itr_0x00010004;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        areas: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true}
                }
            },
            required: true
        },
        actions:{
            type:'object',
            properties: {
                confirm:{type:'number',required:true},
                force:{type:'number',required:true},
                hangup:{type:'number',required:true},
                unhangup:{type:'number',required:true},
            },
            required:true
        }
        ,
        deviceClassID: {
            type: 'array',
            items: {type: 'number'}
        },
        alarmClassID: {
            type: 'array',
            items: {type: 'number'}
        },
        levels: {
            type: 'array',
            items: {type: 'number'}
        },
        startTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true},
        endTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true}
    }
};
/**
 * Created by wangxh on 2017/6/9.
 */

'use strict';

var path = require('path');
var grpc = require('grpc');
var st = require('../../util/small_tools');
var ah = require('../../util/array_helper');
var logger = require('../../util/log_manager').logger;

var command = require('./cmd');
var code = require('./code');
var serverType = require('../../definition/service_type');
var NotifyType = require('./notify_type');

var DataMsg = require('../definition/data_message');
var notifyHelper = require('./notify_helper');

var uiclassID = require('../../definition/uiClassID');
var objectHelper = require('../../objects/object_helper');
var sysconfig = require('../../config/config');
var rs_notify = require('../../restful/notify');

var db = require('../../db');
var rdbNO = db.ramdb.no;
var rdbNOR = db.ramdb.nor;
var rdbCNO = db.ramdb.cno;
var rdbCNOR = db.ramdb.cnor;
var rdbOO = db.ramdb.oo;
var rdbOOR = db.ramdb.oor;
var rdbAST = db.ramdb.asset;
var rdbALP = db.ramdb.alp;
var rdbCDT = db.ramdb.cdt;
var rdbDEP = db.ramdb.dep;
var rdbRole = db.ramdb.role;

var _central_notify = undefined;
var _central_cmd = undefined;
var _clientID = undefined;
var _waiting = false;

var _keep_alive_timer = undefined;

var msg_handerDic = {};

function handle_cmd(cmd, body, callback) {
    var handler = msg_handerDic[cmd];
    if(handler){
        try{
            logger.info('recv req[cmd: 0x%s, body: %j]', cmd.toString(16), body);
            handler.do_action(body, function (err, data) {
                if(err){
                    logger.error(err);
                    logger.error('resp req[cmd: 0x%s error]', cmd.toString(16));
                }else{
                    logger.info('resp req[cmd: 0x%s, status: %d]', cmd.toString(16), code.ok);
                }
                callback(err, data);
            })
        }catch(err){
            logger.error({msg: 'handle cmd failed', cmd: cmd, body: body, err: err});
        }
    }else{
        callback({status: code.not_support});
    }
}

function register_msg_handler(fileName) {
    var wmk_msg_handler = require(fileName);
    if (wmk_msg_handler) {
        msg_handerDic[wmk_msg_handler.cmd] = wmk_msg_handler;
    }
}


function init(config, opt, done) {
    var server = new grpc.Server({'grpc.max_receive_message_length': 1024*1024*1024});

    // switch(opt.type){
    //     case serverType.alarm:
    //         st.traverseDir(__dirname + '/msg_handlers/0x0002_0001', register_msg_handler);
    //         break;
    //     case serverType.intersvr:
    //         st.traverseDir(__dirname + '/msg_handlers/0x0003_0001', register_msg_handler);
    //         break;
    //     default:
    //         break;
    // }

    let _module_proto = grpc.load(path.join(__dirname, '../proto/module.proto')).module;
    server.addService(_module_proto.Module.service, {Request: function (call, callback) {
        let req = call.request;
        let cmd = req.cmd;
        let body = undefined;
        if(req.json){
            body = JSON.parse(req.json);
        }
        handle_cmd(cmd, body, function (err, result) {
            var status = undefined;
            var message = undefined;
            if(err){
                if(err.status != undefined){
                    status = err.status;
                }else{
                    status = code.unknown;
                }
                message = err.msg || code.getText(code);
            } else{
                status = code.ok;
                message = 'OK';
            }

            callback(null, {status: status, msg: message, json: result ? JSON.stringify(result) : ""});
        })
    }});

    var _notify_proto = grpc.load(path.join(__dirname, '../proto/notify.proto')).central;
    server.addService(_notify_proto.Notify.service, {NotifyMsg: function (notify, callback) {
        logger.info('msg: %j', notify.request);

        let msg = _notify_from_grpc(notify.request);
        //通知消息预处理
        notifyHelper.pre_process_server_notify(msg);

        //同步缓存
        _sync_notify(msg);

        //通知消息
        notifyHelper.process_server_notify(msg);

        callback();
    }});

    server.bind('' + opt.host + ':' + opt.port, grpc.ServerCredentials.createInsecure());
    server.start();

    var central_proto = grpc.load(path.join(__dirname, '../proto/central.proto')).central;
    var central_cmd = new central_proto.Central('' + config.host + ':' + config.port, grpc.credentials.createInsecure());
    var central_notify_proto = grpc.load(path.join(__dirname, '../proto/notify.proto')).central;
    var central_notify = new central_notify_proto.Notify('' + config.host + ':' + config.port, grpc.credentials.createInsecure());
    _central_notify = central_notify;
    _central_cmd = central_cmd;

    _sync_data(opt);

    notifyHelper.on_send_notify(function (msg) {
        if(_clientID != undefined){
            notify(msg);
        }else{
            logger.error({msg: 'try send notify, but client is invalid', data: msg})
        }
    });

    if(done){
        done();
    }
}

function send(msg, callback) {
    if(_clientID == undefined){
        return callback({status: code.connection_error, msg: '无法连接到业务中控'});
    }
    switch(msg.cmd){
        case command.cen_0x00000003:
            _central_cmd.SyncData({clientId: _clientID}, function (err, response) {
                if(err) return callback({status: code.other, msg: err.message});
                if(response.status == code.ok){
                    callback();
                }else{
                    callback(response);
                }
            });
            break;
        case command.cen_0x00000004:
            _central_cmd.SetMode({mode: msg.data.mode}, function (err, response) {
                if(err) return callback({status: code.other, msg: err.message});
                if(response.status == code.ok){
                    callback();
                }else{
                    callback(response);
                }
            });
            break;
        case command.cen_0x0000000A:
            _central_cmd.GetServerInfo({clientId: _clientID}, function (err, response) {
                if(err) return callback({status: code.other, msg: err.message});
                if(response.status == code.ok){
                    var data = undefined;
                    if(response.json){
                        data = JSON.parse(response.json);
                    }
                    callback(null, data);
                }else{
                    callback(response);
                }
            });
            break;
        case command.cen_0x0000000B:
            _central_cmd.GetServerState({clientId: _clientID}, function (err, response) {
                if(err) return callback({status: code.other, msg: err.message});
                if(response.status == code.ok){
                    var data = undefined;
                    if(response.json){
                        data = JSON.parse(response.json);
                    }
                    callback(null, data);
                }else{
                    callback(response);
                }
            });
            break;
        case command.cen_0x00000010:
            if(sysconfig && sysconfig.notify){
                //通过服务发送
                rs_notify.send(msg.data, msg.data.mode, function (err) {
                    if(err) return callback({status: code.unknown, msg: err.message});
                    callback({status: code.ok});
                });
            }else{
                _central_cmd.Request({clientId: _clientID, cmd: msg.cmd, json: JSON.stringify(msg.data)}, function (err, response) {
                    if(err) return callback({status: code.other, msg: err.message});
                    if(response.status == code.ok){
                        var data = undefined;
                        if(response.json){
                            data = JSON.parse(response.json);
                        }
                        callback(null, data);
                    }else{
                        callback({status: response.status, msg: response.msg});
                    }
                });
            }
            break;
        case command.cen_0x00000005:
        case command.cen_0x00000006:
        case command.cen_0x00000011:
        case command.cen_0x00000012:
        case command.cen_0x00000013:
        case command.cen_0x00000014:
        case command.cen_0x00000015:
        case command.cen_0x00000016:
            _central_cmd.Request({clientId: _clientID, cmd: msg.cmd, json: JSON.stringify(msg.data)}, function (err, response) {
                if(err) return callback({status: code.other, msg: err.message});
                if(response.status == code.ok){
                    var data = undefined;
                    if(response.json){
                        data = JSON.parse(response.json);
                    }
                    callback(null, data);
                }else{
                    callback({status: response.status, msg: response.msg});
                }
            });
            break;
        case command.cen_0x00010001:
        case command.cen_0x00010002:
        case command.cen_0x00010003:
        case command.cen_0x00010005:
        case command.cen_0x00010006:
        case command.cen_0x00010007:
        case command.cen_0x00010008:
        case command.cen_0x00010010:
        case command.cen_0x00010011:
        case command.cen_0x00010012:
        case command.cen_0x00010013:
            _central_cmd.ReqData({clientId: _clientID, cmd: msg.cmd, json: JSON.stringify(msg.data)}, function (err, response) {
                if(err) return callback({status: code.other, msg: err.message});
                if(response.status == code.ok){
                    var data = undefined;
                    if(response.json){
                        data = JSON.parse(response.json);
                    }
                    callback(null, data);
                }else{
                    callback({status: response.status, msg: response.msg});
                }
            });
            break;
        case command.cen_0x00020002:
        case command.cen_0x00020003:
        case command.cen_0x00020004:
        case command.cen_0x00020005:
        case command.cen_0x00020008:
        case command.cen_0x00020010:
            _central_cmd.ReqAlarm({clientId: _clientID, cmd: msg.cmd, json: JSON.stringify(msg.data)}, function (err, response) {
                if(err) return callback({status: code.other, msg: err.message});
                if(response.status == code.ok){
                    var data = undefined;
                    if(response.json){
                        data = JSON.parse(response.json);
                    }
                    callback(null, data);
                }else{
                    callback({status: response.status, msg: response.msg});
                }
            });
            break;
        case command.cen_0x00030001:
        case command.cen_0x00030002:
        case command.cen_0x00030003:
        case command.cen_0x00030004:
        case command.cen_0x00030005:
            _central_cmd.ReqReport({clientId: _clientID, cmd: msg.cmd, json: JSON.stringify(msg.data)}, function (err, response) {
                if(err) return callback({status: code.other, msg: err.message});
                if(response.status == code.ok){
                    var data = undefined;
                    if(response.json){
                        data = JSON.parse(response.json);
                    }
                    callback(null, data);
                }else{
                    callback({status: response.status, msg: response.msg});
                }
            });
            break;
        case command.cen_0x00000000:
            _central_cmd.Request({clientId: _clientID, cmd: msg.cmd, json: JSON.stringify(msg.data)}, function (err, response) {
                if(err) return callback({status: code.other, msg: err.message});
                if(response.status == code.ok){
                    var data = undefined;
                    if(response.json){
                        data = JSON.parse(response.json);
                    }
                    callback(null, data);
                }else{
                    callback({status: response.status, msg: response.msg});
                }
            });
            break;
        default:
            callback({status: code.not_support});
            break;
    }
}

function notify(msg) {
    let _msg = _notify_to_grpc(msg);
    _central_notify.NotifyMsg(_msg, function (err) {
        if(err) logger.error({msg: 'send notify failed', err: err});
    })
}


//同步
function _sync_data(opt) {
    if(_keep_alive_timer != undefined){
        return;
    }

    //TODO: 断开重连后，需要同步缓存
    _central_cmd.Register({ip: opt.host, port: opt.port, clientType: svrType, regtype: opt.notifies}, function (err, response) {
        if(err) {
            logger.error('regist central failed, %s', err.message);
            setTimeout(function () {
                _sync_data(opt);
            }, 2000);
            return;
        }
        logger.info('regist central success');
        _clientID = response.clientId;

        _keep_alive_timer = setInterval(function () {
            if(_waiting){
                return
            }
            _waiting = true;
            _central_cmd.KeepLive({clientId: _clientID}, function (err, response) {
                _waiting = false;

                if(err || response.status != code.ok) {
                    if(_keep_alive_timer != undefined){
                        clearInterval(_keep_alive_timer);
                        _keep_alive_timer = undefined;
                    }

                    logger.error({msg: 'keep alive failed, restart sync', err: err});
                    _clientID = undefined;//断开重连
                    _sync_data(opt);
                    return;
                }
            });
        }, 5000);
    });
}

function _sync_notify(msg) {
    var type = msg.type;
    var data = msg.data;
    switch(type){
        case NotifyType.restart:
            st.restart_service('receive restart notify');
            break;
        case NotifyType.name_object_created:
        case NotifyType.name_object_modified:
            var container = data.container;
            var object = data.object;
            if(rdbNO && object){
                var obj = objectHelper.createNameObject(object.classID);
                obj.init_from_row(object);

                //删除原对象
                rdbNO.del_no(obj);
                rdbNO.set_no(obj);
            }
            if(rdbNOR && container && object){
                rdbNOR.del_nor(object);
                rdbNOR.add_nor({
                    serverNO: container.serverNO,
                    classID: container.classID,
                    id: container.id,
                    childServerNO: object.serverNO,
                    childClassID: object.classID,
                    childID: object.id
                })
            }
            break;
        case NotifyType.name_object_removed:
            if(rdbNO){
                rdbNO.del_no(data);
            }
            if(rdbNOR){
                rdbNOR.del_nor(data);
            }
            break;
        case NotifyType.name_object_add_relation:
            if(rdbNOR){
                rdbNOR.add_nor(data);
            }
            break;
        case NotifyType.name_object_del_relation:
            if(rdbNOR){
                rdbNOR.del_relation(data);
            }
            break;

        case NotifyType.collect_object_created:
        case NotifyType.collect_object_modified:
            var container = data.container;
            var object = data.object;
            if(rdbCNO && object){
                var obj = objectHelper.createNameObject(object.classID);
                obj.init_from_row(object);

                //删除原对象
                rdbCNO.del_cno(obj);
                rdbCNO.set_cno(obj);
            }
            if(rdbCNOR && container && object){
                rdbCNOR.del_cnor(object);
                rdbCNOR.add_cnor({
                    serverNO: container.serverNO,
                    classID: container.classID,
                    id: container.id,
                    childServerNO: object.serverNO,
                    childClassID: object.classID,
                    childID: object.id
                });
            }
            break;
        case NotifyType.collect_object_removed:
            if(rdbCNO){
                rdbCNO.del_cno(data);
            }
            if(rdbCNOR){
                rdbCNOR.del_cnor(data);
            }
            break;

        case NotifyType.operator_object_created:
        case NotifyType.operator_object_modified:
            var container = data.container;
            var object = data.object;
            if(rdbOO && object){
                var obj = objectHelper.createNameObject(object.classID);
                obj.init_from_row(object);

                //删除原对象
                rdbOO.del_oo(obj);
                rdbOO.set_oo(obj);
            }
            if(rdbOOR && container && object){
                rdbOOR.del_oor(object);
                rdbOOR.add_oor({
                    serverNO: container.serverNO,
                    classID: container.classID,
                    id: container.id,
                    childServerNO: object.serverNO,
                    childClassID: object.classID,
                    childID: object.id
                });
            }
            break;
        case NotifyType.operator_object_removed:
            if(rdbOO){
                rdbOO.del_oo(data);
            }
            if(rdbOOR){
                rdbOOR.del_oor(data);
            }
            break;

        case NotifyType.asset_created:
        case NotifyType.asset_modified:
            if(rdbAST){
                var _asset = objectHelper.createNameObject(uiclassID.asset);
                _asset.init_from_row(data);
                rdbAST.set_asset(_asset);
            }
            break;
        case NotifyType.asset_removed:
            if(rdbAST){
                rdbAST.del_asset(data.aNO);
            }
            break;
        case NotifyType.alarm_type_changed:
            if(rdbALP){
                if(data.config){
                    var config = data.config;
                    if(config.hangup){
                        if(config.hangup.start){
                            config.hangup.start = new Date(config.hangup.start);
                        }
                        if(config.hangup.end){
                            config.hangup.end = new Date(config.hangup.end);
                        }
                    }
                    if(config.shield){
                        if(config.shield.start){
                            config.shield.start = new Date(config.shield.start);
                        }
                        if(config.shield.end){
                            config.shield.end = new Date(config.shield.end);
                        }
                    }
                }
                rdbALP.set_alarm_type(data);
            }
            break;
        case NotifyType.alarm_type_deleted:
            if(rdbALP){
                rdbALP.del_alarm_type(data.id);
            }
            break;
        case NotifyType.device_type_changed:
            if(rdbDEP){
                rdbDEP.set_type(data);
            }
            break;
        case NotifyType.device_type_deleted:
            if(rdbDEP){
                rdbDEP.del_type(data.id);
            }
            break;
        case NotifyType.collect_device_type_changed:
            if(rdbCDT){
                rdbCDT.set_type(data);
            }
            break;
        case NotifyType.collect_device_type_deleted:
            if(rdbCDT){
                rdbCDT.del_type(data.id);
            }
            break;
        case NotifyType.role_modified:
            if(rdbRole){
                rdbRole.set_role(data);
            }
            break;
        case NotifyType.role_deleted:
            if(rdbRole){
                rdbRole.del_role(data);
            }
            break;
        case NotifyType.role_created:
            if(rdbRole){
                rdbRole.set_role(data);
            }
            break;
    }
}

function _notify_from_grpc(msg) {
    let _type = msg.msgtype;

    let _notify = undefined;
    switch(_type){
        case NotifyType.alarm_generated:
            var _data = msg.almgen;
            var _start = {};
            var _dstart = JSON.parse(_data.startJson);
            if(_dstart){
                if(_dstart.pointValue != undefined){
                    _start.pointValue = _dstart.pointValue;
                }
                if(_dstart.pointValueTime != undefined){
                    _start.pointValueTime = new Date(_dstart.pointValueTime);
                }
                if(_dstart.time != undefined){
                    _start.time = new Date(_dstart.time);
                }
            }

            let hangup = undefined;
            if(_data.hangupJson && _data.hangupJson != ''){
                hangup = JSON.parse(_data.hangupJson);
            }

            _notify = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                source: _data.source,
                area: _data.area,
                type: _data.type,
                level: _data.level,
                desc: _data.desc,
                isHangup: _data.isHangup || 0,
                hangup: hangup,
                startTime: new Date(_data.startTime),
                start: _start,
                time: new Date(_data.time)
            };
            if(_data.third_party_id){
                _notify.third_party_id = _data.third_party_id;
            }
            if(_data.open_id){
                _notify.open_id = _data.open_id;
            }
            if(_data.vSource){
                _notify.vSource = _data.vSource;
            }
            break;
        case NotifyType.alarm_confirmed:
        case NotifyType.alarm_force_end:
        case NotifyType.alarm_manual_end:
        case NotifyType.alarm_ended:
            var _data = msg.almcom;
            var _option = undefined;
            if(_data.optionJson){
                _option = JSON.parse(_data.optionJson);
                if(_option && _option.time){
                    _option.time = new Date(_option.time)
                }
            }
            _notify = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                option: _option,
                finished: _data.finished ? 1 : 0,
                time: new Date(_data.time)
            };
            if(_data.vSource){
                _notify.vSource = _data.vSource;
            }
            break;
        case NotifyType.alarm_unhangup:
        case NotifyType.alarm_hangup:
            var _data = msg.almhang;
            var _option = undefined;
            if(_data.optionJson){
                _option = JSON.parse(_data.optionJson);
                if(_option && _option.time){
                    _option.time = new Date(_option.time)
                }
            }
            _notify = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                option: _option,
                time: new Date(_data.time)
            };
            break;
        case NotifyType.alarm_convergenced:
            var _data = msg.almcover;
            _notify = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                list: _data.list,
                time: new Date(_data.time)
            };
            break;
        case NotifyType.alarm_star_changed:
            var _data = msg.almstarchan;
            _notify = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                star: _data.star,
                time: new Date(_data.time)
            };
            break;
        case NotifyType.order_generated:
            var _data = msg.ordgen;
            _notify = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                alarm: _data.alarm
            };
            break;
        case NotifyType.alarm_upload:
        case NotifyType.his_alarm_upload:
            _notify = JSON.parse(msg.alarmJson);
            break;
        case NotifyType.name_object_created:
        case NotifyType.name_object_modified:
        case NotifyType.collect_object_created:
        case NotifyType.collect_object_modified:
        case NotifyType.operator_object_created:
        case NotifyType.operator_object_modified:
            var _data = msg.objchan;
            _notify = {
                container: (_data.container && _data.container.id >= 0) ? _data.container : undefined,
                object: {
                    serverNO: _data.object.serverNO,
                    classID: _data.object.classID,
                    id: _data.object.id,
                    fullName: _data.object.fullName,
                    name: _data.object.name,
                    description: _data.object.description,
                    restData: JSON.parse(_data.object.restDataJson),
                    createTime: new Date(_data.object.createTime),
                    modifyTime: new Date(_data.object.modifyTime)
                },
                points: _data.pointsJson ? JSON.parse(_data.pointsJson) : undefined
            };
            break;
        case NotifyType.name_object_removed:
        case NotifyType.collect_object_removed:
        case NotifyType.operator_object_removed:
            _notify = msg.lstobject;
            break;
        case NotifyType.name_object_add_relation:
        case NotifyType.name_object_del_relation:
            var _data = msg.relations;
            _notify = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                childServerNO: _data.childServerNO,
                childClassID: _data.childClassID,
                childID: _data.childID,
                time: new Date(_data.time)
            };
            break;
        case NotifyType.device_point_modified:
            var _data = msg.devpoint;
            _notify = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                points: _data.pointsJson ? JSON.parse(_data.pointsJson) : undefined,
                reload: _data.reload ? 1: 0,
                type: (_data.type && _data.type.system >= 0) ? _data.type : undefined,
                time: new Date(_data.time)
            };
            break;
        case NotifyType.collect_device_point_changed:
            var _data = msg.colledevpointchan;
            _notify = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                points: _data.pointsJson ? JSON.parse(_data.pointsJson) : undefined,
                time: new Date(_data.time)
            };
            break;
        // case NotifyType.asset_created:
        //     break;
        // case NotifyType.asset_removed:
        //     break;
        // case NotifyType.asset_modified:
        //     break;
        case NotifyType.alarm_type_changed:
            var _data = msg.almtypechan;
            _notify = {
                id: _data.id,
                name: _data.name,
                condition: JSON.parse(_data.conditionJson),
                option: _data.optionJson ? JSON.parse(_data.optionJson) : {},
                config: _data.configJson ? JSON.parse(_data.configJson) : {},
                time: new Date(_data.time)
            };
            break;
        case NotifyType.device_type_changed:
            var _data = msg.devtypechan;
            _notify = {
                system: _data.system,
                systemName: _data.systemName,
                group: _data.group,
                groupName: _data.groupName,
                id: _data.id,
                name: _data.name,
                desc: _data.desc,
                pointList: _data.pointsListJson ? JSON.parse(_data.pointsListJson) : [],
                config: _data.configJson ? JSON.parse(_data.configJson) : {},
                time: new Date(_data.time)
            };
            break;
        case NotifyType.collect_device_type_changed:
            var _data = msg.colldevtypechan;
            _notify = {
                id: _data.id,
                name: _data.name,
                desc: _data.desc,
                pointList: _data.pointsListJson ? JSON.parse(_data.pointsListJson) : [],
                config: _data.configJson ? JSON.parse(_data.configJson) : {},
                data: _data.data,
                time: new Date(_data.time)
            };
            break;
        case NotifyType.device_type_deleted:
            _notify = msg.devtypedel;
            break;
        case NotifyType.alarm_type_deleted:
            _notify = msg.almtypedel;
            break;
        case NotifyType.collect_device_type_deleted:
            _notify = msg.colldevtypedel;
            break;
        case NotifyType.role_modified:
        case NotifyType.role_deleted:
        case NotifyType.role_created:
            _notify = JSON.parse(msg.alarmJson);
            break;
        default:
            break;
    }

    return {type: _type, data: _notify};
}

function _notify_to_grpc(_msg) {
    let _type = _msg.type;
    var _data = _msg.data;

    let msg = {msgtype: _type, clientId: _clientID};
    switch(_type){
        case NotifyType.alarm_generated:
            var _start = {};
            if(_data.start.pointValue != undefined){
                _start.pointValue = _data.start.pointValue;
            }
            if(_data.start.pointValueTime!= undefined){
                _start.pointValueTime = _data.start.pointValueTime.getTime();
            }
            if(_data.start.time!= undefined){
                _start.time = _data.start.time.getTime();
            }
            let handup = '';
            if(_data.handup){
                handup = JSON.stringify(handup);
            }

            msg.almgen = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                source: _data.source,
                area: _data.area,
                type: _data.type,
                level: _data.level,
                desc: _data.desc,
                isHangup: _data.isHangup || 0,
                hangupJson: handup,
                startTime: _data.startTime.getTime(),
                startJson: JSON.stringify(_start),
                time: _data.time.getTime()
            };
            if(_data.third_party_id){
                msg.almgen.third_party_id = _data.third_party_id;
            }
            if(_data.open_id){
                msg.almgen.open_id = _data.open_id;
            }
            if(_data.vSource){
                msg.almgen.vSource = _data.vSource;
            }
            break;
        case NotifyType.alarm_confirmed:
        case NotifyType.alarm_force_end:
        case NotifyType.alarm_manual_end:
        case NotifyType.alarm_ended:
            var _option = JSON.parse(JSON.stringify(_data.option));
            if(_option.time){
                _option.time = _data.option.time.getTime()
            }
            msg.almcom = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                optionJson: JSON.stringify(_option),
                finished: _data.finished ? 1 : 0,
                time: _data.time.getTime()
            };
            if(_data.vSource){
                msg.almcom.vSource = _data.vSource;
            }
            break;
        case NotifyType.alarm_unhangup:
        case NotifyType.alarm_hangup:
            var _option = JSON.parse(JSON.stringify(_data.option));
            if(_option.time){
                _option.time = _data.option.time.getTime()
            }
            msg.almhang = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                optionJson: JSON.stringify(_option),
                time: _data.time.getTime()
            };
            break;
        case NotifyType.alarm_convergenced:
            msg.almcover = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                list: _data.list,
                time: _data.time.getTime()
            };
            break;
        case NotifyType.alarm_star_changed:
            msg.almstarchan = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                star: _data.star,
                time: _data.time.getTime()
            };
            break;
        case NotifyType.order_generated:
            msg.ordgen = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                alarm: _data.alarm
            };
            break;
        case NotifyType.alarm_upload:
        case NotifyType.his_alarm_upload:
            msg.alarmJson = JSON.stringify(_data);
            break;
        case NotifyType.name_object_created:
        case NotifyType.name_object_modified:
        case NotifyType.collect_object_created:
        case NotifyType.collect_object_modified:
        case NotifyType.operator_object_created:
        case NotifyType.operator_object_modified:
            msg.objchan = {
                container: _data.container || {serverNO: -1, classID: -1, id: -1},
                object: {
                    serverNO: _data.object.serverNO,
                    classID: _data.object.classID,
                    id: _data.object.id,
                    fullName: _data.object.fullName,
                    name: _data.object.name,
                    description: _data.object.description,
                    restDataJson: JSON.stringify(_data.object.restData),
                    createTime: _data.object.createTime.getTime(),
                    modifyTime: _data.object.modifyTime.getTime()
                },
                pointsJson: _data.points ? JSON.stringify(_data.points) : ''
            };
            break;
        case NotifyType.name_object_removed:
        case NotifyType.collect_object_removed:
        case NotifyType.operator_object_removed:
            msg.lstobject = _data;
            break;
        case NotifyType.name_object_add_relation:
        case NotifyType.name_object_del_relation:
            msg.relations = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                childServerNO: _data.childServerNO,
                childClassID: _data.childClassID,
                childID: _data.childID,
                time: _data.time.getTime()
            };
            break;
        case NotifyType.device_point_modified:
            msg.devpoint = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                pointsJson: _data.points ? JSON.stringify(_data.points) : '',
                reload: _data.reload ? 1: 0,
                type: _data.type || {system: -1, group: -1, id: -1},
                time: _data.time.getTime()
            };
            break;
        case NotifyType.collect_device_point_changed:
            msg.colledevpointchan = {
                serverNO: _data.serverNO,
                classID: _data.classID,
                id: _data.id,
                pointsJson: _data.points ? JSON.stringify(_data.points) : '',
                time: _data.time.getTime()
            };
            break;
        // case NotifyType.asset_created:
        //     break;
        // case NotifyType.asset_removed:
        //     break;
        // case NotifyType.asset_modified:
        //     break;
        case NotifyType.alarm_type_changed:
            msg.almtypechan = {
                id: _data.id,
                name: _data.name,
                conditionJson: JSON.stringify(_data.condition),
                optionJson: JSON.stringify(_data.option),
                configJson: JSON.stringify(_data.config),
                time: _data.time.getTime()
            };
            break;
        case NotifyType.device_type_changed:
            msg.devtypechan = {
                system: _data.system,
                systemName: _data.systemName,
                group: _data.group,
                groupName: _data.groupName,
                id: _data.id,
                name: _data.name,
                desc: _data.desc,
                pointsListJson: JSON.stringify(_data.pointList),
                configJson: JSON.stringify(_data.config),
                time: _data.time.getTime()
            };
            break;
        case NotifyType.collect_device_type_changed:
            msg.colldevtypechan = {
                id: _data.id,
                name: _data.name,
                desc: _data.desc,
                pointsListJson: JSON.stringify(_data.pointList),
                configJson: JSON.stringify(_data.config),
                data: _data.data,
                time: _data.time.getTime()
            };
            break;
        case NotifyType.device_type_deleted:
            msg.devtypedel = _data;
            break;
        case NotifyType.alarm_type_deleted:
            msg.almtypedel = _data;
            break;
        case NotifyType.collect_device_type_deleted:
            msg.colldevtypedel = _data;
            break;
        case NotifyType.role_modified:
        case NotifyType.role_deleted:
        case NotifyType.role_created:
            msg.alarmJson = JSON.stringify(_data);
            break;
        default:
            break;
    }

    return msg;
}

module.exports.init = init;
module.exports.send = send;
module.exports.notify = notify;
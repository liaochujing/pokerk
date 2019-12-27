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
var NotifyType = require('./notify_type');

var DataMsg = require('../definition/data_message');
var notifyHelper = require('./notify_helper');

var _central_notify = undefined;
var _central_cmd = undefined;
var _clientID = undefined;
var _waiting = false;

var _keep_alive_timer = undefined;

function init(config, opt, done) {
    var server = new grpc.Server({'grpc.max_receive_message_length': 1024*1024*1024});

    var _notify_proto = grpc.load(path.join(__dirname, '../proto/data_notify.proto')).tbnotify;
    server.addService(_notify_proto.TBNotify.service, {NotifyMsg: function (notify, callback) {
        logger.info('msg: %j', notify.request);

        let msg = _notify_from_grpc(notify.request);
        //通知消息预处理
        // notifyHelper.pre_process_server_notify(msg);

        //通知消息
        notifyHelper.process_server_notify(msg);

        callback();
    }});
    server.bind('' + opt.host + ':' + opt.port, grpc.ServerCredentials.createInsecure());
    server.start();

    var central_proto = grpc.load(path.join(__dirname, '../proto/central.proto')).central;
    var central_cmd = new central_proto.Central('' + config.host + ':' + config.port, grpc.credentials.createInsecure());
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
        return callback({status: code.connection_error, msg: '无法连接到数据中控'})
    }
    callback({status: code.not_support});
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
            logger.error({msg: 'regist data central failed', err: err});
            setTimeout(function () {
                _sync_data(opt);
            }, 2000);
            return;
        }
        logger.info('regist data success');
        _clientID = response.clientId;

        _keep_alive_timer = setInterval(function () {
            if(_waiting){
                return;
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

function _notify_from_grpc(msg) {
    let _type = msg.msgtype;
    let _notify = undefined;
    switch(_type){
        case NotifyType.alarm_point_on:
        case NotifyType.alarm_point_off:
            var _data = msg.am;
            _notify = {
                point: _data.pt,
                data: _data.dt,
                alp: _data.alp
            };
            break;

        case NotifyType.third_party_event:
        case NotifyType.third_party_event_operation:
            _notify = JSON.parse(msg.tc);
            break;
        default:
            _notify = _data;
            break;
    }

    return {type: _type, data: _notify};
}

function _notify_to_grpc(msg) {
    let _type = msg.type;
    let _data = msg.data;

    let _notify = undefined;
    switch(_type){
        default:
            _notify = _data;
            break;
    }

    return {msgtype: _type, clientId: _clientID, notifyinfo: _notify};
}

module.exports.init = init;
module.exports.send = send;
module.exports.notify = notify;
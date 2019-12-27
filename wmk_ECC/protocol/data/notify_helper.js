/**
 * Created by wangxh on 2017/7/7.
 */

'use strict';

var notification = require('./../../helpers/notification_helper');
var Emitter = notification.Emitter;

function send_notify(msg) {
    notification.emit(Emitter.data_service, 'notify', msg);
}
function on_send_notify(handler) {
    notification.on(Emitter.data_service, 'notify', handler);
}

function pre_process_server_notify(msg) {
    notification.emit(Emitter.notify_service, 'ps_notify', msg);
}
function on_server_pre_notify(handler) {
    notification.on(Emitter.notify_service, 'ps_notify', handler);
}

function process_server_notify(msg) {
    notification.emit(Emitter.data_service, 's_notify', msg);
}
function on_server_notify(handler) {
    notification.on(Emitter.data_service, 's_notify', handler);
}

function process_client_notify(client, msg) {
    notification.emit(Emitter.data_service, 'c_notify', client, msg);
}
function on_client_notify(handler) {
    notification.on(Emitter.data_service, 'c_notify', handler);
}

module.exports.send_notify = send_notify;
module.exports.on_send_notify = on_send_notify;

module.exports.pre_process_server_notify = pre_process_server_notify;
module.exports.on_server_pre_notify = on_server_pre_notify;

module.exports.process_server_notify = process_server_notify;
module.exports.on_server_notify = on_server_notify;

module.exports.process_client_notify = process_client_notify;
module.exports.on_client_notify = on_client_notify;
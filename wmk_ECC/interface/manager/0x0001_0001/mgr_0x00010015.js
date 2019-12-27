/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;

var db = require('../../../db/index');
var rdbNO = db.ramdb.no;
var rdbNOR = db.ramdb.nor;
var rdbDEP = db.ramdb.dep;

var uiclassID = require('../../../definition/uiClassID');
var objectHelper = require('../../../objects/object_helper');
var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

function handle(req, res, body, callback) {
    var template = db.ramdb.dep.get_device_type(body);
    if(!template){
        callback({status: code.not_found, msg: 'device type not found'});
        return;
    }
    var _type = body.type;
    var _tt = db.ramdb.dep.get_device_type(_type);
    if(_tt && template != _tt){
        callback({status: code.other, msg: 'device type repeat'});
        return;
    }

    var now = new Date();
    
    function update_template(done) {

        var dbDEP = db.dep;
        dbDEP.update_device_type({system: body.system, group: body.group, id: body.id}, {system: _type.system, systemName: _type.systemName, group: _type.group, groupName: _type.groupName, id: _type.id, name: _type.name, 'config.classID': _type.classID, time: now}, function (err) {
            if(err) return done(err);

            rdbDEP.del_type(template);
            notifyHelper.send_notify(new NotifyMsg(NotifyType.device_type_deleted, {system: template.system, group: template.group, id: template.id}));

            template.system = _type.system;
            template.group = _type.group;
            template.id = _type.id;
            template.systemName = _type.systemName;
            template.groupName = _type.groupName;
            template.name = _type.name;
            if(!template.config){
                template.config = {};
            }
            template.config.classID = _type.classID;
            template.time = now;

            rdbDEP.set_type(template);
            notifyHelper.send_notify(new NotifyMsg(NotifyType.device_type_changed, template));

            done();
        })
    }
    
    function apply_to_device(done) {
        var tempList = [];
        var devices = rdbNO.get_by_class_rang(uiclassID.device, uiclassID.lastDevice);
        for(var i=0;i<devices.length;i++){
            var device = devices[i];
            if(device && device.type){
                if (device.type.system == body.system && device.type.group == body.group && device.type.id == body.id) {
                    tempList.push(device);
                }
            }
        }

        if(tempList.length > 0){
            ah.each_series(tempList, function (device, cbItem) {
                change_device_class_id(device, cbItem);
            }, function (err) {
                if(err) return done(err);
                done();
            })
        }else{
            done();
        }
    }

    function change_device_class_id(device, done) {
        var dbNO = db.no;
        var dbNOR = db.nor;
        var dbDP = db.dp;

        var parent = rdbNOR.get_parent_identity(device.serverNO, device.classID, device.id);
        var identity = {serverNO: device.serverNO, classID: device.classID, id: device.id};

        ah.series([function (cb) {
            if(!parent){
                return cb();
            }
            dbNOR.update_relation({childServerNO: identity.serverNO, childClassID: identity.classID, childID: identity.id}, {childClassID: _type.classID}, function (err) {
                if(err) return cb(err);

                db.ramdb.nor.del_nor({serverNO: identity.serverNO, classID: identity.classID, id: identity.id});
                db.ramdb.nor.add_nor({serverNO: parent.serverNO, classID: parent.classID, id: parent.id, childServerNO: identity.serverNO, childClassID: _type.classID, childID: identity.id});

                cb();
            })
        }, function (cb) {
            dbNO.update_nameobject({serverNO: identity.serverNO, classID: identity.classID, id: identity.id}, {classID: _type.classID, 'restData.type': {system: _type.system, group: _type.group, id: _type.id}, modifyTime: now}, function (err) {
                if(err) return cb(err);

                //send notify
                db.ramdb.no.del_no(device);
                notifyHelper.send_notify(new NotifyMsg(NotifyType.name_object_removed, {serverNO: identity.serverNO, classID: identity.classID, id: identity.id}));

                device.classID = _type.classID;
                device.type = {system: _type.system, group: _type.group, id: _type.id};
                var _device = objectHelper.createNameObject(_type.classID);
                _device.load_from_json(device.gen_json_data());
                db.ramdb.no.set_no(_device);

                dbNO.find_nameobject({serverNO: _device.serverNO, classID: _device.classID, id: _device.id}, {_id: 0}, function (err, results) {
                    if(err) {
                        logger.error({msg: 'try notify name object changed failed', obj: _device, err: err});
                        return;
                    }

                    if(results && results.length > 0){
                        notifyHelper.send_notify(new NotifyMsg(NotifyType.name_object_created, {container: parent, object: results[0]}));
                    }
                });

                cb();
            })
        }, function (cb) {
            dbDP.update_devicepoint({deviceServerNO: identity.serverNO, deviceClassID: identity.classID, deviceID: identity.id}, {deviceClassID:  _type.classID, modifyTime: now}, function (err) {
                if(err) return cb(err);
                dbDP.find_point_by_device(device, {_id: 0, pointIndex: 1, config: 1, binding: 1, option: 1}, function (err, points) {
                    if(err) return cb(err);

                    var _points = [];
                    if(points){
                        for(var i=0;i<points.length;i++){
                            var _p = points[i];
                            _points.push({pointIndex: _p.pointIndex, config: _p.config, binding: _p.binding, option: _p.option});
                        }
                    }
                    notifyHelper.send_notify(new NotifyMsg(NotifyType.device_point_modified, {serverNO: device.serverNO, classID: device.classID, id: device.id, reload: 1, type: device.type, points: _points, time: now}));

                    cb();
                });
            })
        }], function (err) {
            if(err) return done(err);
            done();
        })
    }

    update_template(function (err) {
        if(err) return callback(err);
        apply_to_device(function (err) {
            if(err) return callback(err);
            callback();
        })
    });
}

module.exports.cmd = cmd.mgr_0x00010015;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        system: {type: 'number', required: true},
        group: {type: 'number', required: true},
        id: {type: 'number', required: true},
        type: {
            system: {type: 'number', required: true},
            systemName: {type: 'string', required: true},
            group: {type: 'number', required: true},
            groupName: {type: 'string', required: true},
            id: {type: 'number', required: true},
            name: {type: 'string', required: true},
            classID: {type: 'number', required: true, minimum: uiclassID.device, maximum: uiclassID.lastDevice}
        }
    }
};
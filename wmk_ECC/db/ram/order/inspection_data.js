/**
 * Created by wangxh on 2018/6/29.
 */

'use strict';

var util = require('util');
var table_adapter = require('./../table_adapter');

function inspection_data_adapter() {
    var self = this;

    self.tb_name = 'order';

    self.data_list = [];
}

util.inherits(inspection_data_adapter, table_adapter);

inspection_data_adapter.prototype.init = function (param, callback) {
    var self = this;

    var dbNO = require('../../index').no;
    dbNO.find_nameobject_config({key: '_inspection_template'}, {serverNO: 1, classID: 1, id: 1, value: 1},function (err, results) {
        if(err) return callback(err);
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];

                self.data_list.push({
                    serverNO: item.serverNO,
                    classID: item.classID,
                    id: item.id,
                    guid: item.value.guid,
                    data: item.value.data
                })
            }
        }
        callback();
    });
};

inspection_data_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.data_list = [];

    self.init(callback);
};

inspection_data_adapter.prototype.update_inspection_data = function (serverNO, classID, id, guid, data) {
    for(var i=0;i<this.data_list.length;i++){
        var item = this.data_list[i];
        if(item.serverNO == serverNO && item.classID == classID && item.id == id){
            item.guid = guid;
            item.data = data;
            return;
        }
    }
    this.data_list.push({
        serverNO: serverNO,
        classID: classID,
        id: id,
        guid: guid,
        data: data
    })
};

inspection_data_adapter.prototype.remove_inspection_data = function (serverNO, classID, id) {
    for(var i=0;i<this.data_list.length;i++){
        var item = this.data_list[i];
        if(item.serverNO == serverNO && item.classID == classID && item.id == id){
            this.data_list.splice(i, 1);
            return;
        }
    }
};

inspection_data_adapter.prototype.get_by_identity = function (identity) {
    for(var i=0;i<this.data_list.length;i++){
        var item = this.data_list[i];
        if(item.serverNO == identity.serverNO && item.classID == identity.classID && item.id == identity.id){
            return item;
        }
    }
    return undefined;
};

inspection_data_adapter.prototype.get_inspection_data_list = function () {
    return this.data_list;
};

module.exports = inspection_data_adapter;
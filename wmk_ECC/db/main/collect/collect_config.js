/**
 * Created by wangxh on 2018/3/2.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var path_helper = require('../../../util/path_helper');
var mongoose = require('mongoose');
var Grid = require('gridfs-stream');

var Schema = new mongoose.Schema({
    serverNO: Number,
    classID: Number,
    id: Number,
    guid: String,
    md5: String,
    config: Object,
    time: Date
},{collection: "collect_config", versionKey: false});

module.exports = function (conn) {
    var cache_path = path.join(path_helper.cachePath, 'collect_config');
    path_helper.ensure_path(cache_path);

    Grid.mongo = mongoose.mongo;
    var gfs = Grid(conn.db);

    var model = conn.model("collect_config", Schema);

    var format_file_name = function (serverNO, classID, id) {
        return  format_key(serverNO, classID, id, 'config') + '.json'
    };

    model.upsert_collect_config = function (serverNO, classID, id, md5, config, time, callback) {
        model.findOne({serverNO: serverNO, classID: classID, id: id}, {md5: 1}, function (err, data) {
            if(err) return callback(err);
            var record = undefined;
            if(data){
                record = data;
            }
            if(!record || record.md5 != md5){
                var guid = config.system_info.guid;
                var fileName = format_file_name(serverNO, classID, id);
                var fullPath = path.join(cache_path, fileName);
                fs.writeFile(fullPath, JSON.stringify(config), function (err) {
                    if(err) return callback(err);
                    gfs.remove({filename: fileName}, function (err) {
                        if (err) return callback(err);
                        var writestream = gfs.createWriteStream({
                            filename: fileName,
                            metadata: {serverNO: serverNO, classID: classID, id: id},
                            aliases: []
                        });
                        fs.createReadStream(fullPath).pipe(writestream);
                        writestream.on('close', function (file) {
                            model.update({serverNO: serverNO, classID: classID, id: id}, {$set: {guid: guid, md5: md5, time: time}, $unset: {config: 1}}, {upsert: true}, callback)
                        });
                    });
                });
            }else{
                callback();
            }
        });
    };

    model.remove_collect_config = function (serverNO, classID, id, callback) {
        gfs.remove({filename: format_file_name(serverNO, classID, id)}, function (err) {
            if (err) return callback(err);
            model.remove({serverNO: serverNO, classID: classID, id: id}, callback)
        });
    };

    return model;
};
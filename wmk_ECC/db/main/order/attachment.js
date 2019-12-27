/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;

var Schema = new mongoose.Schema({
    filename: String,
    metadata: String,
    aliases: String
}, {collection: "fs.files", versionKey: false});

module.exports = function (conn) {
    var model = conn.model('fs.files', Schema);
    var gfs = Grid(conn.db);

    model.insert_attachment = function (id, filename, callback) {
        var name = path.basename(filename);
        var writestream = gfs.createWriteStream({
            filename: id,
            metadata: name
        });
        fs.createReadStream(filename).pipe(writestream);
        writestream.on('close', function (file) {
            callback();
        });
    };

    model.load_attachment = function (id, filename, callback) {
        var name = path.basename(filename);
        var fs_write_stream = fs.createWriteStream(filename);
        var readstream = gfs.createReadStream({
            filename: id
        });
        readstream.pipe(fs_write_stream);
        fs_write_stream.on('close', function () {
            callback();
        });
    };

    return model;
};
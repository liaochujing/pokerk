/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var util = require('util');
var fs = require('fs');
var path = require('path');
var multiparty = require('multiparty');
var pathHelper = require('../../../util/path_helper');
var ah = require('../../../util/array_helper');

var cmd = require('../cmd');
var code = require('../code');

var OrderState = require('../../../modules/order/definition/order_state');
var OrderAction = require('../../../modules/order/definition/order_action_type');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var dbOrder = db.order;
var dbAttachment = db.attachment;
var dbObjID = db.objID;

function handle(req, res, body, callback) {
    var user = req.user;
    var order = ramdb.order.get_order_sync(body.serverNO, body.classID, body.id);
    if(order){
        //生成multiparty对象，并配置上传目标路径
        var form = new multiparty.Form({uploadDir: pathHelper.cachePath, maxFilesSize: 10 * 1024 * 1024, maxFields: 10});
        //上传完成后处理
        form.parse(req, function(err, fields, files) {
            if(err){
                callback({status: code.unknown, msg: err.message});
            } else {
                if(files.inputFile && files.inputFile.length > 0){
                    var attachmentList = [];
                    ah.each_series(files.inputFile, function (inputFile, cbItem) {
                        dbObjID.gen_object_id('attachment', function (err, id) {
                            if(err) return cbItem(err);
                            var filename = inputFile.path;
                            var dstPath = path.join(pathHelper.cachePath, inputFile.originalFilename);
                            //重命名为真实文件名
                            fs.rename(filename, dstPath, function(err) {
                                if(err) return cbItem(err);
                                dbAttachment.insert_attachment(id, dstPath, function (err) {
                                    if(err) return cbItem(err);
                                    attachmentList.push({id: id, name: inputFile.originalFilename, tag: body.tag});
                                    cbItem();
                                });
                            });
                        });
                    }, function (err) {
                        if(err) return callback({status: code.unknown, msg: 'save file error'});
                        dbOrder.add_attachment(order.serverNO, order.classID, order.id, attachmentList, function (err) {
                            if(err) return callback({status: code.unknown});
                            callback();
                        });
                    })
                }else{
                    callback({status: code.unknown, msg: 'file not found'});
                }
            }
        });
    }else{
        callback({status: code.not_found, msg: 'order not found'});
    }
}

module.exports.cmd = cmd.odr_0x00000006;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};
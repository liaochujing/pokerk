/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var logger = require('../../../util/log_manager').logger;
var objectHelper = require('../../../objects/object_helper');
var PartState = require('../../../modules/asset/definition/part_state');

var db = require('../../../db/index');
var dbObjID = db.objID;

function handle(req, res, body, callback) {
    var user = req.user;

    dbObjID.gen_object_id('parts', function (err, id) {
        if(err) return callback(err);

        var part = objectHelper.createNameObject(uiclassID.parts);

        part.id = id;
        part.type = body.type;
        part.name = body.name;
        part.brand = body.brand;
        part.model = body.model;
        part.supplier = body.supplier;
        part.option = body.option;

        part.state = PartState.storage;

        part.insert_db(function (err) {
            if(err){
                logger.error(err);
                callback(err);
            }else{
                callback();
            }
        })
    });
}

module.exports.cmd = cmd.ast_0x00000013;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        name: {type: 'string', required: true},
        type: {type: 'number', required: true},
        brand: {type: 'string'},
        model: {type: 'string'},
        supplier: {type: 'number'},
        option: {type: 'object'}
    }
};
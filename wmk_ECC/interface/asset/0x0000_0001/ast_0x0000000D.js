/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var db = require('../../../db/index');
var ast = db.ast;

function handle(req, res, body, callback) {
    var types = body;

    var asts = [];
    ast.clear_asset_type(function (err) {
        if(err) {
            logger.error(err);
            callback({status: code.unknown});
            return;
        }
        ah.each_series(types, function (item, cbItem) {
            var groups = [];
            for(var i in item.groups){
                var _item = item.groups[i];
                groups.push({
                    group: _item.group,
                    name: _item.name,
                    desc: _item.desc
                })
            }
            ast.insert_asset_type(item.system, item.name, groups, item.desc, function (err) {
                if(err) return cbItem(err);

                asts.push({system: item.system, name: item.name, desc: item.desc, groups: groups});

                cbItem(err);
            });
        }, function (err) {
            db.ramdb.ast.reset(asts);
            
            if(err){
                logger.error(err);
                callback({status: code.unknown});
                return;
            }

            callback();
        })
    });
}

module.exports.cmd = cmd.ast_0x0000000D;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            system: {type: 'number', required: true},
            name: {type: 'string', required: true},
            desc: {type: 'string'},
            groups: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        group: {type: 'number', required: true},
                        name: {type: 'string', required: true},
                        desc: {type: 'string'}
                    }
                },
                required: true
            }
        }
    },
    required: true
};
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var privilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var OrderState = require('../../../modules/order/definition/order_state');
var OrderAction = require('../../../modules/order/definition/order_action_type');
var cfgKey = require('../../../modules/order/definition/system_config_key');
var NotifyTag = require('../../../modules/order/definition/notify_tag');

var objectHelper = require('../../../objects/object_helper');
var orderNotifyHelper = require('../../../modules/order/processor/order_notify_processor');
var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var dbOrder = db.order;
var dbAsset = db.asset;
var rdbAsset = ramdb.asset;

function handle(req, res, body, callback) {
    var user = req.user;
    var order = ramdb.order.get_order_sync(body.serverNO, body.classID, body.id);
    if(order){
        if(order.recipient != undefined){
            if(order.recipient != user.id){
                callback({status: code.unknown, msg: '您无法处理此工单!'});
                return;
            }
        }
        if(order.state != OrderState.processing){
            callback({status: code.unknown, msg: '工单当前状态不可进行该操作!'});
            return;
        }
        if(order.classID == uiclassID.inspectionOrder && !order.restData.force_next){
            var check_finished = function (data) {
                //TODO: check data is finished
                for(var i=0;i<data.template.length;i++){
                    var _item = data.template[i];
                    for(var _point in _item.points){
                        var _p = _item.points[_point];
                        if(!_p.signature){
                            return false;
                        }
                    }
                }
                return true;
            };
            var roomData = order.restData.rooms;
            var isFinished = true;
            for(var i=0;i<roomData.length;i++){
                var _data = roomData[i].data;
                if(isFinished && !check_finished(_data)){
                    isFinished = false;
                }
            }
            if(!isFinished){
                callback({status: code.unknown, msg: '巡检未完成，请完成巡检后再转交工单!'});
                return;
            }
        }

        var now = new Date();
        var step = order.step + 1;//步骤++
        var state = OrderState.unreceived;
        var recipient = body.recipient;
        var operation = {action: OrderAction.handle, user: user.id, step: order.step, data: body.data, time: now};

        dbOrder.handle_order(order.serverNO, order.classID, order.id, step, state, recipient, now, operation, function (err) {
            if(err) return callback({status: code.unknown, msg: 'update order failed'});

            order.step = step;
            order.state = state;
            order.recipient = recipient;
            order.operationList.push(operation);
            order.sendTime = now;
            order.receiveTime = undefined;
            delete order.notifyInfo['receive'];

            //第三步：维护
            if(order.classID == uiclassID.assetOrder && order.step == 3){
                dbOrder.update({serverNO: order.serverNO, classID: order.classID, id: order.id}, {$set: {'restData.mTime': now}}, function (err) {
                    if(err) {
                        logger.error({msg: 'update order info failed', err: err});
                        return;
                    }
                    order.mTime = now;
                });
                var aNO = undefined;
                if(order.restData && order.restData.asset){
                    aNO = order.restData.asset.aNO;
                }
                if(aNO){
                    dbAsset.asset_maintain(aNO, now, function (err) {
                        if(err) {
                            logger.error({msg: 'update asset maintain info failed', err: err});
                            return;
                        }
                        dbAsset.find_assets({aNO: order.asset.aNO}, {_id: 0, operationList: 0}, function (err, results) {
                            if(err){
                                logger.error({msg: 'find asset failed', err: err});
                                return;
                            }
                            if(results && results.length > 0){
                                notifyHelper.send_notify(new NotifyMsg(NotifyType.asset_modified, results[0]));
                            }
                        });
                    })
                }
            }
            //第三步：演练结果
            if(order.classID == uiclassID.drillOrder && order.step == 3){
                dbOrder.update({serverNO: order.serverNO, classID: order.classID, id: order.id}, {$set: {'restData.mTime': now}}, function (err) {
                    if(err) {
                        logger.error({msg: 'update order info failed', err: err});
                        return;
                    }
                    order.mTime = now;
                })
            }
            //维护工单:转交给运维人员时立即通知运维人员
            if(order.classID == uiclassID.assetOrder && order.recipient == order.restData.maintain){
                var config = ramdb.cfg.get_system_config(cfgKey.maintain);
                orderNotifyHelper.notify_immediately(order, order.recipient, NotifyTag.maintain, config ? config.option : undefined);
            }else{
                orderNotifyHelper.notify_receive(order, '请及时处理')
            }

            callback(null, {id: order.id, state: order.state});
        })
    }else{
        callback({status: code.not_found, msg: 'order not found'});
    }
}

module.exports.privilege = privilegePoint.handleOrder;
module.exports.cmd = cmd.odr_0x00000003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        recipient: {type: 'number', required: true},
        data: {type: 'object'}
    }
};
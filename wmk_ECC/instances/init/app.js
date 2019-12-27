/**
 * Created by wangxh on 2017/7/24.
 */

'use strict';

var fs = require('fs');
var util = require('util');
var _ = require('../../util/global_helper');
var st = require('../../util/small_tools');
var ah = require('../../util/array_helper');
var _logger = require('./../../util/log_manager');
var logger = _logger.logger;
var stateLog = _logger.stateLog;
var version = require('../../config/version');
var config = require('../../config/config');

var uiclassID = require('../../definition/uiClassID');

function gen_privilege_table_config() {
    return [
        {
            id: 1,
            name: '操作员',
            desc: '',
            points: [
                {id: 11, name: '添加', desc: ''},
                {id: 12, name: '删除', desc: ''},
                {id: 13, name: '修改', desc: ''},
                {id: 14, name: '查询', desc: ''}
            ]
        },
        {
            id: 2,
            name: '操作员组',
            desc: '',
            points: [
                {id: 21, name: '添加', desc: ''},
                {id: 22, name: '删除', desc: ''},
                {id: 23, name: '修改', desc: ''},
                {id: 24, name: '查询', desc: ''}
            ]
        },
        {
            id: 3,
            name: '资产管理',
            desc: '',
            points: [
                {id: 31, name: '添加', desc: ''},
                {id: 32, name: '删除', desc: ''},
                {id: 33, name: '修改', desc: ''},
                {id: 34, name: '查询', desc: ''},
                {id: 37, name: '入库', desc: ''},
                {id: 38, name: '出库', desc: ''},
                {id: 39, name: '使用/停用', desc: ''},
                {id: 40, name: '维护/修复', desc: ''},
                {id: 41, name: '报废', desc: ''}
            ]
        },
        {
            id: 10,
            name: '对象',
            desc: '',
            points: [
                {id: 101, name: '添加', desc: ''},
                {id: 102, name: '删除', desc: ''},
                {id: 103, name: '修改', desc: ''},
                {id: 104, name: '查询', desc: ''}
            ]
        },
        {
            id: 30,
            name: '设备类型',
            desc: '',
            points: [
                {id: 301, name: '添加', desc: ''},
                {id: 302, name: '删除', desc: ''},
                {id: 303, name: '修改', desc: ''},
                {id: 304, name: '查询', desc: ''},
            ]
        },
        {
            id: 40,
            name: '设备点',
            desc: '',
            points: [
                // {id: 401, name: '查询', desc: ''},
                {id: 402, name: '屏蔽', desc: ''},
                {id: 403, name: '挂起', desc: ''},
                {id: 404, name: '控制', desc: ''}
            ]
        },
        {
            id: 50,
            name: '报表',
            desc: '',
            points: [
                {id: 501, name: '查询报表', desc: ''}
            ]
        },
        {
            id: 60,
            name: '报表模板',
            desc: '',
            points: [
                {id: 601, name: '添加', desc: ''},
                {id: 602, name: '删除', desc: ''},
                {id: 603, name: '修改', desc: ''},
                {id: 604, name: '查询', desc: ''},
            ]
        },
        {
            id: 70,
            name: '告警',
            desc: '',
            points: [
                // {id: 701, name: '查询提示告警', desc: ''},
                {id: 702, name: '确认提示告警', desc: ''},
                {id: 703, name: '强制结束提示告警', desc: ''},
                {id: 704, name: '挂起提示告警', desc: ''},
                {id: 705, name: '结束提示告警', desc: ''},

                // {id: 711, name: '查询一般告警', desc: ''},
                {id: 712, name: '确认一般告警', desc: ''},
                {id: 713, name: '强制结束一般告警', desc: ''},
                {id: 714, name: '挂起一般告警', desc: ''},
                {id: 715, name: '结束一般告警', desc: ''},

                // {id: 721, name: '查询重要告警', desc: ''},
                {id: 722, name: '确认重要告警', desc: ''},
                {id: 723, name: '强制结束重要告警', desc: ''},
                {id: 724, name: '挂起重要告警', desc: ''},
                {id: 725, name: '结束重要告警', desc: ''},

                // {id: 731, name: '查询紧急告警', desc: ''},
                {id: 732, name: '确认紧急告警', desc: ''},
                {id: 733, name: '强制结束紧急告警', desc: ''},
                {id: 734, name: '挂起紧急告警', desc: ''},
                {id: 735, name: '结束紧急告警', desc: ''}
            ]
        },
        {
            id: 74,
            name: '告警类型',
            desc: '',
            points: [
                {id: 741, name: '添加', desc: ''},
                {id: 742, name: '删除', desc: ''},
                {id: 743, name: '修改', desc: ''},
                {id: 744, name: '查询', desc: ''}
            ]
        },
        {
            id: 75,
            name: '告警屏蔽',
            desc: '',
            points: [
                {id: 751, name: '设置', desc: ''},
                {id: 752, name: '查询', desc: ''}
            ]
        },
        {
            id: 76,
            name: '告警过滤',
            desc: '',
            points: [
                {id: 761, name: '设置', desc: ''},
                {id: 762, name: '查询', desc: ''}
            ]
        },
        {
            id: 80,
            name: '工单',
            desc: '',
            points: [
                {id: 801, name: '添加', desc: ''},
                {id: 802, name: '查询', desc: ''},
                {id: 803, name: '接收', desc: ''},
                {id: 804, name: '处理', desc: ''},
                {id: 805, name: '回退', desc: ''},
                {id: 806, name: '完成', desc: ''}
            ]
        },
        {
            id: 81,
            name: '工单配置',
            desc: '',
            points: [
                {id: 811, name: '设置', desc: ''},
                {id: 812, name: '查询', desc: ''}
            ]
        },
        {
            id: 90,
            name: '联动',
            desc: '',
            points: [
                {id: 901, name: '添加', desc: ''},
                {id: 902, name: '删除', desc: ''},
                {id: 903, name: '修改', desc: ''},
                {id: 904, name: '查询', desc: ''},
            ]
        },
        {
            id: 100,
            name: '日志',
            desc: '',
            points: [
                {id: 1001, name: '查询', desc: ''}
            ]
        }
    ];
}

function gen_operator_config() {
    return [
        {container: {serverNO: 0, classID: 0, id: 0}, object: {serverNO: 0, classID: uiclassID.adminGroup, id: 1, fullName: '系统管理员组', restData: {}, description: ''}},
        {container: {serverNO: 0, classID: uiclassID.adminGroup, id: 1}, object: {serverNO: 0, classID: uiclassID.admin, id: 2, fullName: 'admin', restData: {account: 'admin', password: '123456', description: ''}}}
    ];
}

function gen_asset_type_config() {
    return [
        {
            system: 1,
            name: '电气类',
            groups: [
                {group: 1, name: '高压柜', desc: ''},
                {group: 2, name: '中压柜', desc: ''},
                {group: 3, name: '变压器', desc: ''},
                {group: 4, name: '低压柜', desc: ''},
                {group: 5, name: '柴油发电机', desc: ''},
                {group: 6, name: '高压直流', desc: ''},
                {group: 7, name: 'UPS', desc: ''},
                {group: 8, name: '-48V', desc: ''},
                {group: 9, name: '蓄电池', desc: ''},
                {group: 10, name: '列头柜', desc: ''},
                {group: 11, name: '柴油发电机', desc: ''},
                {group: 12, name: '柴油发电机', desc: ''},
                {group: 13, name: 'PDU', desc: ''}
            ],
            desc: ''
        },{
            system: 2,
            name: 'IT类',
            groups: [
                {group: 1, name: '数据机柜', desc: ''},
                {group: 2, name: '服务器', desc: ''},
                {group: 3, name: '交换机', desc: ''},
                {group: 4, name: '路由器', desc: ''},
                {group: 5, name: '防火墙', desc: ''}
            ],
            desc: ''
        },{
            system: 3,
            name: '弱电类',
            groups: [
                {group: 1, name: 'NVR', desc: ''},
                {group: 2, name: '摄像头', desc: ''},
                {group: 3, name: '门禁控制器', desc: ''},
                {group: 4, name: '读卡器', desc: ''},
                {group: 5, name: '动环采集器', desc: ''},
                {group: 6, name: '电池巡检仪', desc: ''},
                {group: 7, name: '漏水检测控制器', desc: ''},
                {group: 8, name: '报警主机', desc: ''},
                {group: 9, name: '红外探头', desc: ''},
                {group: 10, name: '烟感', desc: ''},
                {group: 11, name: '温感', desc: ''},
                {group: 12, name: '消防主机', desc: ''},
                {group: 13, name: '极早期', desc: ''},
                {group: 14, name: 'DDC控制器', desc: ''},
                {group: 15, name: 'BA网络控制器', desc: ''}
            ],
            desc: ''
        },{
            system: 4,
            name: '暖通类',
            groups: [
                {group: 1, name: '冷水机组', desc: ''},
                {group: 2, name: '板换', desc: ''},
                {group: 3, name: '冷却塔', desc: ''},
                {group: 4, name: '水泵', desc: ''},
                {group: 5, name: '蓄冷罐', desc: ''},
                {group: 6, name: '精密空调', desc: ''},
                {group: 7, name: 'AHU', desc: ''},
                {group: 8, name: '新风机', desc: ''},
                {group: 9, name: '加湿机', desc: ''},
                {group: 10, name: '阀门', desc: ''},
                {group: 11, name: '环境传感器', desc: ''}
            ],
            desc: ''
        }];
}

function init_config() {
    var config = {
        systemConfig: [],
        depList: [],
        cdtList: [],
        alpList: [],
        instance: [],
        collectInstance: [],
        pointConfig: [],
        pointBindingConfig: [],
        privilegeList: gen_privilege_table_config(),
        operatorConfig: gen_operator_config(),
        astList: gen_asset_type_config()
    };

    console.log('start init service');
    var configHelper = require('../../helpers/data_config_helper');
    configHelper.import_config(config, function (err) {
        if(err){
            console.log(err);
        }

        process.exit(0);
    })
}

//启动
function run(param) {
    ah.series([print_run_info, function (cb) {
        init_db(param, cb);
    }, init_modules], function (err) {
        if(err){
            logger.error({msg: 'start service failed', err: err});
            process.exit(1);
        }else{
            process.on('uncaughtException', function(err) {
                logger.error(err);
                //process.exit(1);
            });

            logger.mark('start service success');

            init_config();
        }
    });
}

//打印启动信息
function print_run_info(callback) {
    logger.mark('-----------------------------------');
    logger.mark('start manager service version %s', version);
    
    callback();
}

//启动模块
function init_modules(callback) {
    var alarm = require('../../modules/init');
    alarm.init(function (err) {
        if(err) return callback(err);
        callback();
    });
}

//启动数据库
function init_db(param, callback) {
    var db = require('./../../db/index');
    db.init({cache: ['dep', 'cdt']}, function (err) {
        if(err){
            callback({msg: 'init db failed', err: err});
        }else{
            callback();
        }
    });
}

module.exports.run = run;
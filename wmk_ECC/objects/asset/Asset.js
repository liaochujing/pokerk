/**
 * Created by wangxh on 2017/11/12.
 */

'use strict';

var db = require('../../db/index');
var asset = db.asset;

function Assets() {
    //变量
    this.aNO = '';//编号
    this.name = '';//名称
    this.model = '';//型号
    this.type = undefined;//类型
    this.ratedPower = 0;//额定功率
    this.brand = '';//品牌
    this.supplier = 0;//厂商(供应商)
    this.mcycle = 0;//维保周期
    this.ucycle = 0;//更新周期
    // this.ulife = 0;//更新年限:更新年限=投产日期+更新年限周期(计算)
    this.wlife = undefined;//过保年限
    this.purDate = undefined;//购买日期
    this.pdDate = undefined;//投产日期
    this.stDate = undefined;//停产日期

    // this.uuDate = undefined;//停用日期

    this.region = undefined;//安装位置
    this.option = undefined;//自定义属性

    this.state = 0;//状态
}

Assets.prototype.insert_db = function (callback) {
    this.createTime = new Date();
    this.modifyTime = this.createTime;

    asset.insert_asset(
        this.aNO,
        this.name,
        this.model,
        this.type,
        this.ratedPower,
        this.brand,
        this.supplier,
        this.mcycle,
        this.ucycle,
        this.wlife,
        this.purDate,
        this.pdDate,
        this.stDate,
        this.region,
        this.state,
        this.option,
        this.createTime,
        callback);
};

// Assets.prototype.update_db = function (callback) {
//     this.modifyTime = new Date();
//
//     asset.update_asset(
//         this.aNO,
//         this.name,
//         this.model,
//         this.ratedPower,
//         this.brand,
//         this.supplier,
//         this.mcycle,
//         this.ucycle,
//         this.wlife,
//         this.purDate,
//         this.pdDate,
//         this.stDate,
//         this.state,
//         this.option,
//         callback);
// };
//
// Assets.prototype.delete_db = function (callback) {
//     asset.delete_assets(this.aNO, callback);
// };

Assets.prototype.init_from_row = function (row) {
    this.aNO = row.aNO;
    this.name = row.name;
    this.model = row.model;
    this.type = row.type;
    this.ratedPower = row.ratedPower;
    this.brand = row.brand;
    this.supplier = row.supplier;
    this.mcycle = row.mcycle;
    this.ucycle = row.ucycle;
    this.wlife = row.wlife;
    this.purDate = row.purDate;
    this.pdDate = row.pdDate;
    this.stDate = row.stDate;
    // this.uuDate = row.uuDate;
    this.region = row.region;
    this.state = row.state;
    this.option = row.option;
    this.lmDate = row.lmDate;
    this.createTime = row.createTime;
    this.modifyTime = row.createTime;
};

module.exports = Assets;
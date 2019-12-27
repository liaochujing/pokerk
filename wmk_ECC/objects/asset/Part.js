/**
 * Created by wangxh on 2017/11/12.
 */

'use strict';

var db = require('../../db/index');
var part = db.parts;

function Part() {
    //变量
    this.id = '';//id
    this.type = 0;//类型
    this.name = '';//名称
    this.model = '';//型号
    this.brand = '';//品牌
    this.supplier = 0;//厂商(供应商)
    this.option = undefined;//自定义属性

    this.state = 0;//状态
}

Part.prototype.insert_db = function (callback) {
    this.createTime = new Date();
    this.modifyTime = this.createTime;

    part.insert_parts(this.id, this.type, this.name, this.brand, this.model, this.supplier, this.state, this.option, this.createTime, callback)
};

Part.prototype.init_from_row = function (row) {
    this.id = row.id;
    this.type = row.type;
    this.name = row.name;
    this.brand = row.brand;
    this.model = row.model;
    this.supplier = row.supplier;
    this.state = row.state;
    this.option = row.option;
};

module.exports = Part;
/**
 * Created by wangxh on 2017/11/12.
 */

'use strict';

var db = require('../../db/index');
var supplier = db.supplier;

function Supplier() {
    //变量
    this.id = 0;
    this.name = '';
    this.fullName = '';
    this.contacts = '';
    this.tel = '';
    this.fax = '';
    this.postalCode = '';
    this.location = '';
    this.website = '';
    this.deviceType = undefined;
    this.state = 0;
    this.desc = '';
}

Supplier.prototype.insert_db = function (callback) {
    this.createTime = new Date();
    this.modifyTime = this.createTime;

    supplier.insert_supplier(this.id, this.name, this.fullName, this.contacts, this.tel, this.fax, this.postalCode, this.location, this.website, this.deviceType, this.state, this.desc, this.createTime, this.modifyTime, callback);
};

Supplier.prototype.update_db = function (callback) {
    this.modifyTime = new Date();

    supplier.update_supplier(this.id, this.name, this.fullName, this.contacts, this.tel, this.fax, this.postalCode, this.location, this.website, this.deviceType, this.state, this.desc, this.modifyTime, callback);
};

Supplier.prototype.delete_db = function (callback) {
    supplier.delete_supplier(this.id, callback)
};

module.exports = Supplier;
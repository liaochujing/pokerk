/**
 * Created by wangxh on 2017/11/12.
 */

'use strict';

var db = require('../../db/index');
var customer = db.customer;

function Customer() {
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

Customer.prototype.insert_db = function (callback) {
    this.createTime = new Date();
    this.modifyTime = this.createTime;

    customer.insert_customer(this.id, this.name, this.fullName, this.contacts, this.tel, this.fax, this.postalCode, this.location, this.website, this.state, this.desc, this.createTime, this.modifyTime, callback);
};

Customer.prototype.update_db = function (callback) {
    this.modifyTime = new Date();

    customer.update_customer(this.id, this.name, this.fullName, this.contacts, this.tel, this.fax, this.postalCode, this.location, this.website, this.state, this.desc, this.modifyTime, callback);
};

Customer.prototype.delete_db = function (callback) {
    customer.delete_customer(this.id, callback)
};

module.exports = Customer;
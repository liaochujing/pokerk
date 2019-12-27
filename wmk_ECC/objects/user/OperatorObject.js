/**
 * Created by wangxh on 2017/10/17.
 */

'use strict';

var def = require('../../definition/constants');
var uiclassID = require('../../definition/uiClassID');
var NameObject = require('../NameObject');

var db = require('../../db/index');

function OperatorObject() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.operatorObject;
}

OperatorObject.prototype = new NameObject();


OperatorObject.prototype.insert_db = function (callback) {
    var oo = db.oo;

    this.modifyTime = new Date();
    this.createTime = this.modifyTime;

    oo.insert_operator_object(this.serverNO, this.classID, this.id, this.fullName, this.description, this.gen_rest_data(), this.createTime, function (err) {
        callback(err);
    });
};

OperatorObject.prototype.delete_db = function (callback) {
    var oo = db.oo;
    oo.delete_operator_object(this.serverNO, this.classID, this.id, callback);
};

module.exports = OperatorObject;
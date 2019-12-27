/**
 * Created by wangxh on 2017/11/22.
 */

'use strict';


var util = require('util');
var ah = require('../../util/array_helper');
var st = require('../../util/small_tools');
var logger = require('../../util/log_manager').logger;
var def = require('../../definition/constants');
var uiclassID = require('../../definition/uiClassID');
var collectMode = require('../../definition/collect_mode');
var NameObject = require('../NameObject');

var db = require('../../db/index');
var base = NameObject.prototype;

function cObject() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.cObject;
}

cObject.prototype = new NameObject();

cObject.prototype.insert_db = function (callback) {
    var dbCNO = db.cno;

    this.modifyTime = new Date();
    this.createTime = this.modifyTime;

    dbCNO.insert_collect_object(this.serverNO, this.classID, this.id, this.fullName, this.gen_rest_data(), this.description, this.createTime, this.modifyTime, callback);
};

cObject.prototype.update_db = function (callback) {
    var dbCNO = db.cno;
    dbCNO.update_collect_object(this.serverNO, this.classID, this.id, this.fullName, this.gen_rest_data(), this.description, this.modifyTime, callback);
};

cObject.prototype.delete_db = function (callback) {
    var dbCNO = db.cno;
    dbCNO.delete_collect_object(this.serverNO, this.classID, this.id, callback);
};

module.exports = cObject;
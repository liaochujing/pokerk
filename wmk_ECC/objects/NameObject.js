/**
 * Created by wangxh on 2017/7/19.
 */

'use strict';

var util = require('util');
var logger = require('../util/log_manager').logger;
var def = require('../definition/constants');
var uiclassID = require('../definition/uiClassID');
var AccessObject = require('./access/AccessObject');

var db = require('../db/index');
var no = db.no;

function NameObject() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.nameObject;            //对象的类型ID
    
    this.id = 0;                                        //对象的ID
    // this.fullName = '';                                //对象的名称
    // this.name = '';                              //别名
    // this.createTime = def.defaultDate;            //对象的创建时间
    // this.modifyTime = def.defaultDate;          //对象的最后修改时间
    // this.description = '';                             //对象的描述
}

NameObject.prototype = new AccessObject();

NameObject.prototype.get_base_info = function () {
    if(!this._base_info){
        this._base_info = '{serverNO: ' + this.serverNO + ',classID: ' + this.classID + ',id: ' + this.id + ',fullName ' + this.fullName + '}';
    }
    return this._base_info;
};

NameObject.prototype.insert_db = function (callback) {
    if(!this.modifyTime){
        this.modifyTime = new Date();           //对象的最后修改时间
    }
    if(!this.createTime){
        this.createTime = this.modifyTime;  //对象的创建时间
    }

    no.insert_nameobject(this.serverNO,
        this.classID,
        this.id,
        this.fullName,
        this.name,
        this.gen_rest_data(),
        this.description,
        this.createTime,
        this.modifyTime,
        function (err, result) {
            if (callback) {
                callback(err, result);
            }
        });
};

NameObject.prototype.delete_db = function (callback) {
    no.delete_nameobject(this.serverNO, this.classID, this.id, callback);
};

// NameObject.prototype.update_db = function (callback) {
//     this.modifyTime = new Date();                 //对象的最后修改时间
//     no.update_nameobject(this.serverNO,
//         this.classID,
//         this.id,
//         this.fullName,
//         this.gen_rest_data(),
//         this.description,
//         this.modifyTime, callback);
// };

NameObject.prototype.init_from_row = function (item) {
    // this._id = item._id;
    this.serverNO = item.serverNO;
    this.classID = item.classID;
    this.id = item.id;
    this.fullName = item.fullName;
    this.name = item.name;

    if (item.restData) {
        var restData = item.restData;
        this.parse_rest_data(restData);
    }

    if(item.description != undefined){
        this.description = item.description;
    }
    if(item.createTime){
        if(typeof item.createTime == 'string'){
            item.createTime = new Date(item.createTime);
        }
        this.createTime = item.createTime;
    }
    if(item.modifyTime){
        if(typeof item.modifyTime == 'string'){
            item.modifyTime = new Date(item.modifyTime);
        }
        this.modifyTime = item.modifyTime;
    }
};

NameObject.prototype.load_from_json = function (jObject) {
    try {
        this.serverNO = jObject.serverNO;
        this.classID = jObject.classID;
        this.id = jObject.id;
        this.fullName = jObject.fullName;
        this.name = jObject.name;

        if(jObject.restData){
            this.parse_rest_data(jObject.restData);
        }
        if(jObject.description != undefined){
            this.description = jObject.description;
        }
        if(jObject.createTime){
            if(typeof jObject.createTime == 'string'){
                jObject.createTime = new Date(jObject.createTime);
            }
            this.createTime = jObject.createTime;
        }
        if(jObject.modifyTime){
            if(typeof jObject.modifyTime == 'string'){
                jObject.modifyTime = new Date(jObject.modifyTime);
            }
            this.modifyTime = jObject.modifyTime;
        }
    } catch (e) {
        logger.error(e);
    }
};

NameObject.prototype.gen_json_data = function () {
    var resust = {
        serverNO: this.serverNO,
        classID: this.classID,
        id: this.id,
        fullName: this.fullName,
        name: this.name,
        description: this.description,
        restData: this.gen_rest_data()
    };
    return resust;
};

NameObject.prototype.gen_rest_data = function () {
    var _schema = this._schema;
    if(_schema){
        var restData = {};
        _gen_rest_data(_schema, this, restData);
        return restData;
    }else{
        return {}
    }
};

NameObject.prototype.parse_rest_data = function (restData) {
    var _schema = this._schema;
    if(_schema){
        _parse_rest_data(_schema, this, restData);
    }
};

function _gen_rest_data(schema, nameobject, restData) {
    if(schema){
        if(schema.base){
            _gen_rest_data(schema.base, nameobject, restData)
        }
        if(schema.extend){
            for(var key in schema.extend){
                var value = nameobject[key];
                if(value != undefined){
                    restData[key] = value;
                }
            }
        }
    }
}

function _parse_rest_data(schema, nameobject, restData) {
    if(schema){
        if(schema.base){
            _parse_rest_data(schema.base, nameobject, restData)
        }
        if(restData && schema.extend){
            for(var key in schema.extend){
                if(restData[key] != undefined){
                    nameobject[key] = restData[key];
                }
            }
        }
    }
}

module.exports = NameObject;
/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

function AccessObject() {
}

AccessObject.prototype.insert_db = function (callback) {
    callback(new Error('not implemented'));
};

AccessObject.prototype.delete_db = function (callback) {
    callback(new Error('not implemented'));
};

AccessObject.prototype.update_db = function (callback) {
    callback(new Error('not implemented'));
};

AccessObject.prototype.init_from_row = function (item) {
};

module.exports = AccessObject;
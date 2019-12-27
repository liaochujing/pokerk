/**
 * Created by wangxh on 2018/1/21.
 */

'use strict';

var errors = {
    noError: 0,
    tooBig: 1,
    noSuchName: 2,
    badValue: 3,
    readOnly: 4,
    genErr: 5,
    noAccess: 6,
    wrongType: 7,
    wrongLength: 8,
    wrongEncoding: 9,
    wrongValue: 10,
    noCreation: 11,
    inconsistentValue: 12,
    resourceUnavailable: 13,
    commitFailed: 14,
    undoFailed: 15,
    authorizationError: 16,
    notWritable: 17,
    inconsistentName: 18
};

var snmpErrorText = {
    0: 'noError',
    1: 'tooBig',
    2: 'noSuchName',
    3: 'badValue',
    4: 'readOnly',
    5: 'genErr',
    6: 'noAccess',
    7: 'wrongType',
    8: 'wrongLength',
    9: 'wrongEncoding',
    10: 'wrongValue',
    11: 'noCreation',
    12: 'inconsistentValue',
    13: 'resourceUnavailable',
    14: 'commitFailed',
    15: 'undoFailed',
    16: 'authorizationError',
    17: 'notWritable',
    18: 'inconsistentName'
};

function getText(err) {
    if (snmpErrorText[err]) {
        return snmpErrorText[err];
    } else {
        return err;
    }
}

module.exports = errors;
module.exports.getText = getText;
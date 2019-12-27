/**
 * Created by wangxh on 2017/5/2.
 */

'use strict';

var events = require('events');
var util = require('util');

function SocketBuffer (head_length, readBodyLength) {
    events.EventEmitter.call(this);

    this.head_length = head_length;
    this.getBodyLength = readBodyLength;

    this.clear();
}

util.inherits(SocketBuffer, events.EventEmitter);

SocketBuffer.prototype.clear = function () {
    this.buffers = [];
    this.total_unread_length = 0;
    this.curr_pos = 0;
    this.head = null;
    this.bytes_to_read = this.head_length;
};

SocketBuffer.prototype.add_buffer = function (buff) {
    this.buffers.push(buff);
    this.total_unread_length += buff.length;
    this._check_enough_data();
};

SocketBuffer.prototype._check_enough_data = function () {
    // if not enough data, wait for new buffer to be pushed in
    if (this.total_unread_length < this.bytes_to_read) {
        return;
    }
    if (!this.head) {
        // head
        var first_buff = this.buffers[0];
        if (this.curr_pos + this.bytes_to_read <= first_buff.length) {
            this.head = first_buff.slice(this.curr_pos, this.curr_pos + this.bytes_to_read);
            this._skip_data(this.bytes_to_read);
            // read head finished, to read body
            this.bytes_to_read = this.getBodyLength(this.head);
            // head and body in the same buffer?
            if (this.curr_pos >= this.head_length &&
                this.curr_pos + this.bytes_to_read <= first_buff.length) {
                var packet = first_buff.slice(this.curr_pos - this.head_length, this.curr_pos + this.bytes_to_read);
                this._skip_data(this.bytes_to_read);
                // to read head again
                this.head = null;
                this.bytes_to_read = this.head_length;
                this.emit('packet', packet);
            }
        } else {
            this.head = new Buffer(this.head_length);
            this._data_to_buffer(this.head, 0);
            // read head finished, to read body
            this.bytes_to_read = this.getBodyLength(this.head);
        }
    } else {
        // body
        // copy head and body into a new Buffer
        var buff = new Buffer(this.head_length + this.bytes_to_read);
        this.head.copy(buff);
        this._data_to_buffer(buff, this.head_length);
        // read body finished, to read head again
        this.head = null;
        this.bytes_to_read = this.head_length;
        this.emit('packet', buff);
    }
    this._check_enough_data();
};

SocketBuffer.prototype._skip_data = function (length_to_skip) {
    this.total_unread_length -= length_to_skip;
    if (this.curr_pos + length_to_skip < this.buffers[0].length) {
        // there are unread data in the first buffer
        this.curr_pos += length_to_skip;
    } else {
        // no unread data in the first buffer
        this.buffers.shift();
        this.curr_pos = 0;
    }
};

SocketBuffer.prototype._data_to_buffer = function (buff, start_pos) {
    var copyed_length_total = 0;
    while (this.buffers.length > 0) {
        var first_buff = this.buffers[0];
        if (first_buff.length === 0) {
            this.buffers.shift();
            continue;
        };
        var copyed_length = first_buff.copy(buff, start_pos, this.curr_pos);
        this._skip_data(copyed_length);
        start_pos += copyed_length;
        copyed_length_total += copyed_length;
        if (copyed_length_total >= this.bytes_to_read) {
            break;
        }
    }
};

module.exports = SocketBuffer;
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.VisitedArray = exports.Dictionary = exports.LabelledCircularQueue = exports.CircularBufferQueue = exports.DoubleStackQueue = void 0;
var Util = require("./Utility");
var DoubleStackQueue = /** @class */ (function () {
    function DoubleStackQueue() {
        this.incoming = [];
        this.outgoing = [];
        this.size = 0;
    }
    DoubleStackQueue.prototype.Shift = function () {
        while (this.incoming.length > 0) {
            var last = this.incoming.pop();
            this.outgoing.push(last);
        }
    };
    DoubleStackQueue.prototype.Enqueue = function (value) {
        this.size += 1;
        this.incoming.push(value);
    };
    DoubleStackQueue.prototype.Peek = function () {
        if (this.outgoing.length == 0) {
            this.Shift();
        }
        return this.outgoing[this.outgoing.length - 1];
    };
    DoubleStackQueue.prototype.Dequeue = function () {
        if (this.outgoing.length == 0) {
            this.Shift();
        }
        this.size -= 1;
        return this.outgoing.pop();
    };
    DoubleStackQueue.prototype.Count = function () {
        return this.size;
    };
    return DoubleStackQueue;
}());
exports.DoubleStackQueue = DoubleStackQueue;
var CircularBufferQueue = /** @class */ (function () {
    function CircularBufferQueue(initialSize) {
        if (initialSize === void 0) { initialSize = 32; }
        this.head = 0; //Dequeue location
        this.tail = 0; //Insertion location
        this.count = 0;
        this.buffer = new Array(initialSize);
    }
    CircularBufferQueue.prototype.Resize = function (currentSize, newSize) {
        var resized = new Array(newSize);
        for (var i = 0; i < currentSize; i++) {
            var ind = (this.tail + i) % currentSize;
            resized[i] = this.buffer[ind];
        }
        this.buffer = resized;
        this.tail = 0;
        this.head = this.count;
    };
    CircularBufferQueue.prototype.Enqueue = function (value) {
        this.count++;
        this.buffer[this.head] = value;
        this.head = (this.head + 1);
        if (this.head >= this.buffer.length) {
            this.head = 0;
        }
        if (this.head == this.tail) {
            //Max capacity reached
            //Expand buffer
            this.Resize(this.buffer.length, this.buffer.length * 2);
        }
    };
    CircularBufferQueue.prototype.Peek = function () {
        return this.buffer[this.tail];
    };
    CircularBufferQueue.prototype.Dequeue = function () {
        this.count -= 1;
        var element = this.buffer[this.tail];
        this.tail++;
        if (this.tail >= this.buffer.length) {
            this.tail = 0;
        }
        return element;
    };
    CircularBufferQueue.prototype.Count = function () {
        return this.count;
    };
    return CircularBufferQueue;
}());
exports.CircularBufferQueue = CircularBufferQueue;
var LabelledCircularQueue = /** @class */ (function (_super) {
    __extends(LabelledCircularQueue, _super);
    function LabelledCircularQueue(initialSize) {
        if (initialSize === void 0) { initialSize = 32; }
        var _this = _super.call(this, initialSize) || this;
        _this.skip = Util.Fill(initialSize, false);
        _this.indices = new Dictionary();
        return _this;
    }
    LabelledCircularQueue.prototype.ResizeBuffers = function (currentSize, newSize) {
        var resizedSkip = new Array(newSize);
        var resizedBuffer = new Array(newSize);
        var newDict = new Dictionary();
        var destInd = 0;
        for (var i = 0; i < currentSize; i++) {
            var ind = (this.tail + i) % currentSize;
            if (this.skip[ind])
                continue;
            var currentValue = this.buffer[ind];
            resizedBuffer[destInd] = currentValue;
            resizedSkip[destInd] = false;
            newDict.Set(currentValue, destInd);
            destInd++;
        }
        this.indices = newDict;
        this.buffer = resizedBuffer;
        this.skip = resizedSkip;
        this.tail = 0;
        this.head = this.count;
    };
    LabelledCircularQueue.prototype.Contains = function (value) {
        return this.indices.ContainsKey(value);
    };
    LabelledCircularQueue.prototype.Remove = function (value) {
        this.count--;
        var ind = this.indices.Get(value);
        if (!this.indices.ContainsKey(value)) {
            throw new Error("queue does not contain element " + value);
        }
        this.indices.Remove(value);
        this.skip[ind] = true;
    };
    LabelledCircularQueue.prototype.Enqueue = function (value) {
        this.count++;
        this.skip[this.head] = false;
        this.buffer[this.head] = value;
        if (this.indices.ContainsKey(value)) {
            throw new Error("Queue contains duplicate " + value);
        }
        this.indices.Set(value, this.head);
        this.head++;
        if (this.head >= this.buffer.length) {
            this.head = 0;
        }
        if (this.head == this.tail) {
            //Max capacity reached
            //Expand buffer
            this.ResizeBuffers(this.buffer.length, this.buffer.length * 2);
        }
    };
    LabelledCircularQueue.prototype.MoveToValid = function () {
        //Moves the dequeue index past all the skipped elements
        while (this.skip[this.tail]) {
            this.tail = (this.tail + 1) % this.skip.length;
        }
    };
    LabelledCircularQueue.prototype.Peek = function () {
        this.MoveToValid();
        return _super.prototype.Peek.call(this);
    };
    LabelledCircularQueue.prototype.Dequeue = function () {
        this.MoveToValid();
        var dequeued = _super.prototype.Dequeue.call(this);
        if (!this.indices.ContainsKey(dequeued)) {
            throw new Error("queue does not contain element " + dequeued);
        }
        this.indices.Remove(dequeued);
        return dequeued;
    };
    return LabelledCircularQueue;
}(CircularBufferQueue));
exports.LabelledCircularQueue = LabelledCircularQueue;
//Implemented to get typescript to stop complaining about noImplicitAny from the Object based hashtable
var Dictionary = /** @class */ (function () {
    function Dictionary() {
        this.hashtable = {};
    }
    Dictionary.prototype.ContainsKey = function (key) {
        return this.hashtable.hasOwnProperty(key);
    };
    Dictionary.prototype.Remove = function (key) {
        delete this.hashtable[key];
    };
    Dictionary.prototype.Get = function (key) {
        return this.hashtable[key];
    };
    Dictionary.prototype.Set = function (key, value) {
        this.hashtable[key] = value;
    };
    return Dictionary;
}());
exports.Dictionary = Dictionary;
var VisitedArray = /** @class */ (function () {
    function VisitedArray(size) {
        this.visited = Util.Fill(size, -1);
        this.token = 0;
    }
    VisitedArray.prototype.UpdateToken = function () {
        var threshold = 2147483647;
        if (this.token >= threshold) {
            //Loop back to prevent overflow issues
            this.token = 1;
            //Clear old values
            Util.Memset(this.visited, 0);
        }
        this.token += 1;
        return [this.visited, this.token];
    };
    return VisitedArray;
}());
exports.VisitedArray = VisitedArray;

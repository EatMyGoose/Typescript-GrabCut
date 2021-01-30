"use strict";
exports.__esModule = true;
exports.VisitedArray = exports.ObjectDict2 = exports.ObjectDict = void 0;
var Util = require("../Utility");
var ObjectDict = /** @class */ (function () {
    function ObjectDict() {
        this.hashtable = {};
    }
    ObjectDict.prototype.ContainsKey = function (key) {
        return this.hashtable.hasOwnProperty(key);
    };
    ObjectDict.prototype.Remove = function (key) {
        delete this.hashtable[key];
    };
    ObjectDict.prototype.Get = function (key) {
        return this.hashtable[key];
    };
    ObjectDict.prototype.Set = function (key, value) {
        this.hashtable[key] = value;
    };
    return ObjectDict;
}());
exports.ObjectDict = ObjectDict;
var ObjectDict2 = /** @class */ (function () {
    function ObjectDict2() {
        this.hashtable = {};
        this.status = {}; //true if occupied, false otherwise
    }
    ObjectDict2.prototype.ContainsKey = function (key) {
        return this.hashtable.hasOwnProperty(key) && this.status[key];
    };
    ObjectDict2.prototype.Remove = function (key) {
        this.status[key] = false;
    };
    ObjectDict2.prototype.Get = function (key) {
        if (this.ContainsKey(key))
            return this.hashtable[key];
        else
            throw new Error("Error: key does not exist: ${key}");
    };
    ObjectDict2.prototype.Set = function (key, value) {
        this.hashtable[key] = value;
        this.status[key] = true;
    };
    return ObjectDict2;
}());
exports.ObjectDict2 = ObjectDict2;
//Cheaper alternative to a dictionary for marking visits
//Returns an array of integers, which can be set to the "visited token"
//Calling UpdateToken returns the same array but increments the "visited token"
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

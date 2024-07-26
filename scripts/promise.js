"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Promise = exports.queueMicrotask = void 0;
function queueMicrotask(callback, errorHandler) {
    if (errorHandler === void 0) { errorHandler = function (err) {
        Log.err("Uncaught (in promise)");
        Log.err(err);
    }; }
    Core.app.post(function () {
        try {
            callback();
        }
        catch (err) {
            errorHandler(err);
        }
    });
}
exports.queueMicrotask = queueMicrotask;
var Promise = /** @class */ (function () {
    function Promise(initializer) {
        var _this = this;
        this.state = ["pending"];
        this.resolveHandlers = [];
        this.rejectHandlers = [];
        initializer(function (value) {
            _this.state = ["resolved", value];
            queueMicrotask(function () { return _this.resolve(); });
        }, function (error) {
            _this.state = ["rejected", error];
            queueMicrotask(function () { return _this.reject(); });
        });
    }
    Promise.prototype.resolve = function () {
        var state = this.state;
        this.resolveHandlers.forEach(function (h) { return h(state[1]); });
    };
    Promise.prototype.reject = function () {
        var state = this.state;
        this.rejectHandlers.forEach(function (h) { return h(state[1]); });
    };
    Promise.prototype.then = function (callback) {
        var _a = Promise.withResolvers(), promise = _a.promise, resolve = _a.resolve, reject = _a.reject;
        this.resolveHandlers.push(function (value) {
            var result = callback(value);
            if (result instanceof Promise) {
                result.then(function (nextResult) { return resolve(nextResult); });
            }
            else {
                resolve(result);
            }
        });
        return promise;
    };
    Promise.prototype.catch = function (callback) {
        var _a = Promise.withResolvers(), promise = _a.promise, resolve = _a.resolve, reject = _a.reject;
        this.rejectHandlers.push(function (value) {
            var result = callback(value);
            if (result instanceof Promise) {
                result.then(function (nextResult) { return resolve(nextResult); });
            }
            else {
                resolve(result);
            }
        });
        return promise;
    };
    Promise.withResolvers = function () {
        var resolve;
        var reject;
        var promise = new Promise(function (r, j) {
            resolve = r;
            reject = j;
        });
        return {
            promise: promise,
            resolve: resolve,
            reject: reject
        };
    };
    Promise.all = function (promises) {
        var _a = Promise.withResolvers(), promise = _a.promise, resolve = _a.resolve, reject = _a.reject;
        var outputs = new Array(promises.length);
        var resolutions = 0;
        promises.map(function (p, i) {
            return p.then(function (v) {
                outputs[i] = v;
                resolutions++;
                if (resolutions == promises.length)
                    resolve(outputs);
            });
        });
        return promise;
    };
    Promise.resolve = function (value) {
        return new Promise(function (resolve) { return resolve(value); });
    };
    return Promise;
}());
exports.Promise = Promise;

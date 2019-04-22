"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
function waitWebSocketMessage(ws, timeout = 3000) {
    return __awaiter(this, void 0, void 0, function* () {
        return PromiseTimeout((resolve) => {
            ws.onmessage = (ev) => {
                ws.onmessage = null;
                resolve(ev);
            };
        }, timeout);
    });
}
exports.waitWebSocketMessage = waitWebSocketMessage;
function waitWebsocketOpen(ws) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            ws.onopen = () => {
                ws.onopen = null;
                resolve();
            };
        });
    });
}
exports.waitWebsocketOpen = waitWebsocketOpen;
function readBlob(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Response(data).arrayBuffer();
    });
}
exports.readBlob = readBlob;
function waitWebSocketBinary(ws, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield waitWebSocketMessage(ws)
            .then(ev => readBlob(ev.data));
    });
}
exports.waitWebSocketBinary = waitWebSocketBinary;
function PromiseTimeout(executor, timeout) {
    return new Promise((resolve, reject) => {
        if (timeout !== undefined) {
            setTimeout(() => {
                reject("Timeout");
            }, timeout);
        }
        executor(resolve, reject);
    });
}
exports.PromiseTimeout = PromiseTimeout;
function promiseOrNot(input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (input instanceof Promise)
            input = yield input;
        return input;
    });
}
exports.promiseOrNot = promiseOrNot;
//# sourceMappingURL=util.js.map
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
class Queue {
    constructor() {
        this._length = 0;
    }
    get length() { return this._length; }
    enqueue(element) {
        if (!this.header)
            this.header = this.tail = {
                element: element,
                next: null,
                prior: null
            };
        else {
            this.tail = {
                element: element,
                prior: this.tail,
                next: null
            };
        }
        if (this.tail.prior)
            this.tail.prior.next = this.tail;
        this._length++;
        this.dequeueResolve && this.resolveDequeue();
    }
    rejectAwaiter(reason) {
        const reject = this.dequeueReject;
        this.dequeueReject = null;
        this.dequeueResolve = null;
        reject && reject(reason);
        return;
    }
    resolveDequeue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dequeueResolve) {
                const resolve = this.dequeueResolve;
                this.dequeueResolve = null;
                this.dequeueReject = null;
                yield resolve(this.dequeueInternal());
            }
        });
    }
    dequeueInternal() {
        var node = this.header;
        this.header = this.header.next;
        if (this.header)
            this.header.prior = null;
        this._length--;
        return node.element;
    }
    dequeue() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.header) {
                    this.dequeueResolve = resolve;
                    this.dequeueReject = reject;
                }
                else
                    resolve(this.dequeueInternal());
            });
        });
    }
}
exports.Queue = Queue;
class WebSocketMessageQueue {
    constructor(websocket) {
        this.queue = new Queue();
        this.websocket = websocket;
        websocket.addEventListener("message", (e) => this.onMessage(e));
    }
    update(websocket, reject = false) {
        this.websocket = websocket;
        this.websocket.addEventListener("message", (e) => this.onMessage(e));
        if (reject)
            this.queue.rejectAwaiter(new Error("Stop message receiving"));
    }
    onMessage(e) {
        return __awaiter(this, void 0, void 0, function* () {
            this.queue.enqueue(yield readBlob(e.data));
        });
    }
    receive(timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.queue.dequeue();
        });
    }
}
exports.WebSocketMessageQueue = WebSocketMessageQueue;
//# sourceMappingURL=util.js.map
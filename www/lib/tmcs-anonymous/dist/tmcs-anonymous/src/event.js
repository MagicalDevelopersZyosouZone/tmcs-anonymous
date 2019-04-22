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
const util_1 = require("./util");
class PromiseEventTrigger {
    constructor() {
        this.eventqueue = [];
    }
    on(listener) {
        this.listener = listener;
        if (this.eventqueue.length > 0) {
            this.eventqueue.forEach(e => this.dispatch(e));
            this.eventqueue = [];
        }
    }
    off() {
        this.listener = null;
    }
    trigger(args) {
        return new Promise((resolve, reject) => {
            const event = {
                args: args,
                resolver: resolve,
                rejecter: reject
            };
            if (this.listener)
                this.dispatch(event);
            else
                this.eventqueue.push(event);
        });
    }
    dispatch(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield util_1.promiseOrNot(this.listener(event.args));
                event.resolver(result);
            }
            catch (err) {
                event.rejecter(err);
            }
        });
    }
}
exports.PromiseEventTrigger = PromiseEventTrigger;
//# sourceMappingURL=event.js.map
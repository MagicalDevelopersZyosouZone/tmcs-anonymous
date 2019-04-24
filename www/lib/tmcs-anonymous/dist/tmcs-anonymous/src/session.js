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
const message_1 = require("./message");
const event_1 = require("./event");
class Session {
    constructor(tmcs, name) {
        this.users = [];
        this.messages = [];
        this.onMessage = new event_1.PromiseEventTrigger();
        this.name = name;
        this.tmcs = tmcs;
    }
    send(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = new message_1.Message(this.tmcs.user.fingerprint, null, text);
            message.state = message_1.MessageState.Pending;
            const msgs = this.users.filter(usr => usr !== this.tmcs.user).map((usr) => {
                const msg = new message_1.Message(this.tmcs.user.fingerprint, usr.fingerprint, text);
                msg.time = new Date();
                return msg;
            });
            // Handle State
            setTimeout(() => {
                (() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield Promise.all(msgs.map((msg) => {
                            return new Promise((resolve, reject) => {
                                msg.onStateChange.on(state => {
                                    if (state & message_1.MessageState.Received)
                                        resolve();
                                    else if (!(state & message_1.MessageState.Pending))
                                        reject();
                                });
                            });
                        }));
                        message.state = message_1.MessageState.Received;
                        message.onStateChange.trigger(message_1.MessageState.Received);
                    }
                    catch (_a) {
                        message.state = message_1.MessageState.Failed;
                        message.onStateChange.trigger(message.state);
                    }
                }))();
                // Send
                (() => __awaiter(this, void 0, void 0, function* () {
                    yield Promise.all(msgs.map((msg) => __awaiter(this, void 0, void 0, function* () {
                        yield this.tmcs.send(msg);
                    })));
                }))();
            }, 10);
            this.messages.push(message);
            this.onMessage.trigger(message);
            return message;
        });
    }
}
exports.Session = Session;
//# sourceMappingURL=session.js.map
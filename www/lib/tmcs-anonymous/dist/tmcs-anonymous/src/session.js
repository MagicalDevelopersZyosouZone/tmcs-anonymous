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
class Session {
    constructor(tmcs) {
        this.users = [];
        this.messages = [];
        this.tmcs = tmcs;
    }
    send(text) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.users.filter(usr => usr !== this.tmcs.user).map((usr) => __awaiter(this, void 0, void 0, function* () {
                const msg = new message_1.Message(this.tmcs.user.fingerprint, usr.fingerprint, text);
                msg.time = new Date();
                yield this.tmcs.send(msg);
            })));
        });
    }
}
exports.Session = Session;
//# sourceMappingURL=session.js.map
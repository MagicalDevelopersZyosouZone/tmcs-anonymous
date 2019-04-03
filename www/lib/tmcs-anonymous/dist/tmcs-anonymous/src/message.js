"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openpgp_1 = __importDefault(require("openpgp"));
class Message {
    get armored() { return this.armored; }
    constructor(sender, receiver, body, id = -1) {
        this.msgId = id;
        this.sender = sender;
        this.receiver = receiver;
        if (typeof (body) === "string") {
            this.body = body;
            this.message = openpgp_1.default.message.fromText(body);
        }
        else {
            this.rawBody = body;
            this.message = openpgp_1.default.message.fromBinary(body);
        }
    }
    encrypt(pubkey, prvkey) {
        return __awaiter(this, void 0, void 0, function* () {
            const enc = yield openpgp_1.default.encrypt({
                message: this.message,
                armor: false,
                publicKeys: [pubkey],
                privateKeys: [prvkey],
                detached: false,
            });
            this.rawBody = enc.message.packets.write();
            return this.rawBody;
        });
    }
    decrypt(prvkey) {
        return __awaiter(this, void 0, void 0, function* () {
            const dec = yield openpgp_1.default.decrypt({
                message: this.message,
                privateKeys: [prvkey],
            });
            this.body = openpgp_1.default.util.decode_utf8(dec.data);
            return this.body;
        });
    }
    verify(pubkey) {
        return __awaiter(this, void 0, void 0, function* () {
            const ver = yield openpgp_1.default.verify({
                message: this.message,
                publicKeys: [pubkey]
            });
            return ver.signatures[0].valid;
        });
    }
}
exports.Message = Message;
//# sourceMappingURL=message.js.map
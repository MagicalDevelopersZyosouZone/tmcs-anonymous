"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const openpgp = __importStar(require("openpgp"));
const tmcs_proto_1 = require("tmcs-proto");
var MessageState;
(function (MessageState) {
    MessageState[MessageState["Pending"] = -2] = "Pending";
    MessageState[MessageState["Sended"] = -1] = "Sended";
    MessageState[MessageState["Lost"] = 0] = "Lost";
    MessageState[MessageState["Received"] = 1] = "Received";
    MessageState[MessageState["Reject"] = 8] = "Reject";
    MessageState[MessageState["Timeout"] = 2] = "Timeout";
    MessageState[MessageState["Failed"] = 4] = "Failed";
})(MessageState = exports.MessageState || (exports.MessageState = {}));
class Message {
    constructor(sender, receiver, body, id = -1) {
        this._verified = false;
        this.msgId = id;
        this.sender = sender;
        this.receiver = receiver;
        if (typeof (body) === "string") {
            this.body = body;
        }
        else {
            this.rawBody = body;
        }
        this.time = new Date();
    }
    get verified() { return this._verified; }
    get armored() { return this.armored; }
    encrypt(pubkey, prvkey) {
        return __awaiter(this, void 0, void 0, function* () {
            const enc = yield openpgp.encrypt({
                message: openpgp.message.fromText(this.body),
                armor: false,
                publicKeys: [pubkey],
                privateKeys: [prvkey],
                detached: false,
            });
            this.rawBody = enc.message.packets.write();
            return this.rawBody;
        });
    }
    decrypt(prvkey, pubkey) {
        return __awaiter(this, void 0, void 0, function* () {
            const dec = yield openpgp.decrypt({
                message: yield openpgp.message.read(this.rawBody),
                privateKeys: [prvkey],
                publicKeys: pubkey ? [pubkey] : undefined,
            });
            this.body = dec.data;
            if (pubkey) {
                this._verified = dec.signatures[0].valid && pubkey.getFingerprint() === this.sender;
            }
            return this.body;
        });
    }
}
exports.Message = Message;
//# sourceMappingURL=message.js.map
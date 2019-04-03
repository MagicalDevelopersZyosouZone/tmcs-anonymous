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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openpgp = __importStar(require("openpgp"));
const tmcs_proto_1 = __importDefault(require("tmcs-proto"));
const tmcs_proto_2 = require("tmcs-proto");
const util_1 = require("./util");
const message_1 = require("./message");
const user_1 = require("./user");
class TMCSAnonymous {
    constructor(address, useSSL = true) {
        this.contacts = [];
        this.state = "none";
        this.msgId = 1;
        const reg = /^(https?:\/\/)?(.+?)\/?$/;
        const match = reg.exec(address);
        if (match) {
            this.remoteAddress = match[2];
            this.useSSL = match[1] === "https://"
                ? true
                : match[1] === "http://"
                    ? false
                    : useSSL;
        }
        else
            throw new Error("Invalid address");
    }
    get httpProtocol() { return this.useSSL ? "https://" : "http://"; }
    get wsProtocol() { return this.useSSL ? "wss://" : "ws://"; }
    get httpBaseAddr() { return `${this.httpProtocol}${this.remoteAddress}`; }
    setkey(pubkeyArmored, prvkeyArmored) {
        return __awaiter(this, void 0, void 0, function* () {
            this.user.pubkey = (yield openpgp.key.readArmored(pubkeyArmored)).keys[0];
            if (prvkeyArmored)
                this.user.prvkey = (yield openpgp.key.readArmored(prvkeyArmored)).keys[0];
        });
    }
    generateKey(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            options.bits = options.bits || 2048;
            options.name = options.name || "Anonymous";
            options.email = options.email || "anonymous@mdzz.studio";
            const key = yield openpgp.generateKey({
                numBits: options.bits,
                userIds: [{ name: options.name, email: options.email }],
                keyExpirationTime: 86400,
            });
            yield this.setkey(key.publicKeyArmored, key.privateKeyArmored);
            return key.key;
        });
    }
    registerKey() {
        return __awaiter(this, void 0, void 0, function* () {
            const registerParam = {
                name: "Anonymous",
                pubkey: this.user.pubkey.armor(),
                sign: openpgp.util.Uint8Array_to_b64(yield this.sign(openpgp.util.hex_to_Uint8Array(this.user.pubkey.getFingerprint()))),
            };
            const result = yield fetch(`${this.httpBaseAddr}/key/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                cache: "no-cache",
                body: JSON.stringify(registerParam)
            }).then(response => response.json());
            if (result.error != tmcs_proto_1.default.TMCSError.ErrorCode.NONE) {
                throw new Error(result.msg);
            }
            this.state = "registed";
            return `${this.httpBaseAddr}/chat/${result.data}`;
        });
    }
    sign(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const sign = yield openpgp.sign({
                message: openpgp.message.fromBinary(buffer),
                privateKeys: [this.user.prvkey],
                detached: true,
                armor: false,
            });
            if (sign && sign.signature)
                return sign.signature.packets.write();
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.websocket = new WebSocket(`${this.wsProtocol}${this.remoteAddress}/ws`);
            yield util_1.waitWebsocketOpen(this.websocket);
            // Handshake ->
            const handshake = new tmcs_proto_1.default.TMCSMsg.ClientHandShake();
            handshake.setClientversion(1);
            this.websocket.send(handshake.serializeBinary());
            // <- Handshake
            let buffer = yield util_1.waitWebSocketBinary(this.websocket, this.timeout);
            const serverHandshake = tmcs_proto_1.default.TMCSMsg.ServerHandShake.deserializeBinary(buffer);
            const token = openpgp.util.hex_to_Uint8Array(serverHandshake.getToken());
            // Sigin ->
            const sign = yield openpgp.sign({
                message: openpgp.message.fromBinary(token),
                privateKeys: [this.user.prvkey],
                detached: true,
                armor: false
            });
            const signInMsg = new tmcs_proto_1.default.TMCSMsg.SignIn();
            signInMsg.setFingerprint(this.user.pubkey.getFingerprint());
            signInMsg.setToken(serverHandshake.getToken());
            signInMsg.setSign(sign.signature.packets.write());
            this.websocket.send(signInMsg.serializeBinary());
            // <- Comfirm
            buffer = yield util_1.waitWebSocketBinary(this.websocket, this.timeout);
            const confirm = tmcs_proto_1.default.TMCSMsg.ServerHandShake.deserializeBinary(buffer);
            this.state = "pending";
            this.websocket.onmessage = (ev) => this.handle(ev);
        });
    }
    handle(ev) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const buffer = yield util_1.readBlob(ev.data);
                const signedMsg = tmcs_proto_1.default.TMCSMsg.SignedMsg.deserializeBinary(buffer);
                switch (signedMsg.getType()) {
                    case tmcs_proto_1.default.TMCSMsg.SignedMsg.Type.ERROR:
                        const err = tmcs_proto_2.TMCSError.Error.deserializeBinary(signedMsg.getBody_asU8());
                        this.errorHandler(err);
                        return;
                    case tmcs_proto_2.TMCSMsg.SignedMsg.Type.MESSAGE:
                        const msgPack = tmcs_proto_2.TMCSMsg.MessagePack.deserializeBinary(signedMsg.getBody_asU8());
                        this.msgHandler(msgPack, signedMsg.getSender());
                        return;
                    case tmcs_proto_2.TMCSMsg.SignedMsg.Type.RECEIPT:
                        const receiptPack = tmcs_proto_2.TMCSMsg.ReceiptPack.deserializeBinary(signedMsg.getBody_asU8());
                        this.receiptHandler(receiptPack);
                        return;
                    default:
                        throw new Error("Received invalid messge.");
                }
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    errorHandler(err) {
        console.error(`Server error: ${err.getCode()}: ${err.getMessage()}`);
    }
    msgHandler(msgPack, sender) {
        return __awaiter(this, void 0, void 0, function* () {
            const messages = msgPack.getMsgList()
                .map(msg => new message_1.Message(sender, msg.getReceiver(), msg.getEncryptedmsg_asU8(), msg.getMsgid()));
            let usr = this.contacts.filter(usr => usr.fingerprint === sender)[0];
            // Treat as contact request
            if (!usr) {
                const request = messages[0];
                if (!request)
                    throw new Error(`Invalid contact request from {${sender}}`);
                const armored = yield request.decrypt(this.user.prvkey);
                const pubkey = (yield openpgp.key.readArmored(armored)).keys[0];
                if (!pubkey)
                    throw new Error(`Invalid contact request from {${sender}}`);
                if (!request.verify(pubkey))
                    throw new Error(`Unsigned contact request from {${sender}}`);
                usr = new user_1.User("Anonymous", pubkey);
                if (this.onContactRequest) {
                    let accept = this.onContactRequest(usr);
                    if (accept instanceof Promise)
                        accept = yield accept;
                    if (!accept) {
                        this.sendPack(this.receipt(messages, sender, tmcs_proto_2.TMCSMsg.MsgReceipt.MsgState.REJECT), sender);
                        return;
                    }
                }
            }
            this.sendPack(this.receipt(messages, sender), sender);
            messages.forEach(msg => {
                const session = this.sessions.filter(session => session.users.some(usr => usr.fingerprint === msg.sender))[0];
                if (!session) {
                    let usr = this.contacts.filter(usr => usr.fingerprint === msg.sender)[0];
                    // Treat as contact request.
                    if (!usr) {
                    }
                }
            });
        });
    }
    receiptHandler(receipts) {
    }
    sendPack(pack, receiver) {
        return __awaiter(this, void 0, void 0, function* () {
            const signedMsg = new tmcs_proto_2.TMCSMsg.SignedMsg();
            signedMsg.setId(++this.msgId);
            signedMsg.setReceiver(receiver);
            signedMsg.setSender(this.user.pubkey.getFingerprint());
            if (pack instanceof tmcs_proto_2.TMCSMsg.ReceiptPack) {
                const buffer = pack.serializeBinary();
                const sign = yield openpgp.sign({
                    message: openpgp.message.fromBinary(buffer),
                    privateKeys: [this.user.prvkey],
                    armor: false,
                    detached: true,
                });
                signedMsg.setType(tmcs_proto_2.TMCSMsg.SignedMsg.Type.RECEIPT);
                signedMsg.setBody(buffer);
                signedMsg.setSign(sign.signature.packets.write());
            }
            else if (pack instanceof tmcs_proto_2.TMCSMsg.MessagePack) {
                const buffer = pack.serializeBinary();
                const sign = yield openpgp.sign({
                    message: openpgp.message.fromBinary(buffer),
                    privateKeys: [this.user.prvkey],
                    armor: false,
                    detached: true,
                });
                signedMsg.setType(tmcs_proto_2.TMCSMsg.SignedMsg.Type.MESSAGE);
                signedMsg.setBody(buffer);
                signedMsg.setSign(sign.signature.packets.write());
            }
            const buffer = signedMsg.serializeBinary();
            this.websocket.send(buffer);
        });
    }
    receipt(messages, receiver, state = tmcs_proto_2.TMCSMsg.MsgReceipt.MsgState.RECEIVED) {
        const pack = new tmcs_proto_2.TMCSMsg.ReceiptPack();
        pack.setReceiptsList(messages.map(msg => {
            const receipt = new tmcs_proto_2.TMCSMsg.MsgReceipt();
            receipt.setMsgid(msg.msgId);
            receipt.setState(state);
            return receipt;
        }));
        return pack;
    }
}
exports.default = TMCSAnonymous;
//# sourceMappingURL=index.js.map
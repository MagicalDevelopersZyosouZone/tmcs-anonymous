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
const tmcs_msg_pb_1 = __importDefault(require("./proto/tmcs_msg_pb"));
const util_1 = require("./util");
class TMCSAnonymous {
    constructor(address, useSSL = true) {
        this.state = "none";
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
            this.pubkey = (yield openpgp.key.readArmored(pubkeyArmored)).keys[0];
            if (prvkeyArmored)
                this.prvKey = (yield openpgp.key.readArmored(prvkeyArmored)).keys[0];
        });
    }
    generateKey(options) {
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
                pubkey: this.pubkey.armor(),
                sign: openpgp.util.Uint8Array_to_b64(yield this.sign(openpgp.util.hex_to_Uint8Array(this.pubkey.getFingerprint()))),
            };
            const result = yield fetch(`${this.httpBaseAddr}/key/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                cache: "no-cache",
                body: JSON.stringify(registerParam)
            }).then(response => response.json());
            if (result.error != tmcs_msg_pb_1.default.ErrorCode.NONE) {
                throw new Error(result.msg);
            }
            this.inviteLink = `${this.httpBaseAddr}/chat/${result.data}`;
            this.state = "registed";
            return this.inviteLink;
        });
    }
    sign(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const sign = yield openpgp.sign({
                message: openpgp.message.fromBinary(buffer),
                privateKeys: [this.prvKey],
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
            const handshake = new tmcs_msg_pb_1.default.ClientHandShake();
            handshake.setClientversion(1);
            this.websocket.send(handshake.serializeBinary());
            // <- Handshake
            let buffer = yield util_1.waitWebSocketBinary(this.websocket, this.timeout);
            const serverHandshake = tmcs_msg_pb_1.default.ServerHandShake.deserializeBinary(buffer);
            const token = openpgp.util.hex_to_Uint8Array(serverHandshake.getToken());
            // Sigin ->
            const sign = yield openpgp.sign({
                message: openpgp.message.fromBinary(token),
                privateKeys: [this.prvKey],
                detached: true,
                armor: false
            });
            const signInMsg = new tmcs_msg_pb_1.default.SignIn();
            signInMsg.setFingerprint(this.pubkey.getFingerprint());
            signInMsg.setToken(serverHandshake.getToken());
            signInMsg.setSign(sign.signature.packets.write());
            this.websocket.send(signInMsg.serializeBinary());
            // <- Comfirm
            buffer = yield util_1.waitWebSocketBinary(this.websocket, this.timeout);
            const confirm = tmcs_msg_pb_1.default.ServerHandShake.deserializeBinary(buffer);
            this.state = "pending";
        });
    }
}
exports.default = TMCSAnonymous;
//# sourceMappingURL=index.js.map
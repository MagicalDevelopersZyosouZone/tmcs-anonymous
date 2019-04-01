import * as openpgp from "openpgp";
import tmcs_msg from "tmcs-proto";
import { waitWebsocketOpen, readBlob, waitWebSocketMessage, waitWebSocketBinary } from "./util";
interface KeyOptions
{
    bits?: 1024 | 2048 | 4096;
    name?: string;
    email?: string;
}
interface RegisterParam
{
    name: string;
    pubkey: string;
    sign: string;
}
interface ServerResponse
{
    error: number;
    msg: string;
    data: string;
}
export default class TMCSAnonymous
{
    remoteAddress: string;
    useSSL: boolean;
    pubkey: openpgp.key.Key;
    prvKey: openpgp.key.Key;
    websocket: WebSocket;
    state: "none" | "registed" | "pending" | "ready" | "disconnected" = "none";
    timeout: 3000;
    private get httpProtocol() { return this.useSSL ? "https://" : "http://" }
    private get wsProtocol() { return this.useSSL ? "wss://" : "ws://" }
    private get httpBaseAddr() { return `${this.httpProtocol}${this.remoteAddress}` }

    constructor(address:string, useSSL:boolean = true)
    {
        const reg = /^(https?:\/\/)?(.+?)\/?$/;
        const match = reg.exec(address);
        if (match)
        {
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
    async setkey(pubkeyArmored: string, prvkeyArmored: string)
    {
        this.pubkey = (await openpgp.key.readArmored(pubkeyArmored)).keys[0];
        if (prvkeyArmored)
            this.prvKey = (await openpgp.key.readArmored(prvkeyArmored)).keys[0];
    }
    async generateKey(options: KeyOptions = {})
    {
        options.bits = options.bits || 2048;
        options.name = options.name || "Anonymous";
        options.email = options.email || "anonymous@mdzz.studio";
        const key = await openpgp.generateKey({
            numBits: options.bits,
            userIds: [{ name: options.name, email: options.email }],
            keyExpirationTime: 86400,
        });
        await this.setkey(key.publicKeyArmored, key.privateKeyArmored);
        return key.key;
    }
    async registerKey()
    {
        const registerParam: RegisterParam = {
            name: "Anonymous",
            pubkey: this.pubkey.armor(),
            sign: openpgp.util.Uint8Array_to_b64(await this.sign(openpgp.util.hex_to_Uint8Array(this.pubkey.getFingerprint()))),
        }
        const result: ServerResponse = await fetch(`${this.httpBaseAddr}/key/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json" ,
            },
            cache: "no-cache",
            body: JSON.stringify(registerParam)
        }).then(response => response.json());
        if (result.error != tmcs_msg.TMCSError.ErrorCode.NONE)
        {
            throw new Error(result.msg);
        }
        this.state = "registed";
        return `${this.httpBaseAddr}/chat/${result.data}`;
    }
    async sign(buffer: Uint8Array)
    {
        const sign = await openpgp.sign({
            message: openpgp.message.fromBinary(buffer),
            privateKeys: [this.prvKey],
            detached: true,
            armor: false,
        });
        if (sign && sign.signature)
            return sign.signature.packets.write();
    }
    async connect()
    {
        this.websocket = new WebSocket(`${this.wsProtocol}${this.remoteAddress}/ws`);
        await waitWebsocketOpen(this.websocket);

        // Handshake ->
        const handshake = new tmcs_msg.TMCSMsg.ClientHandShake();
        handshake.setClientversion(1);
        this.websocket.send(handshake.serializeBinary());

        // <- Handshake
        let buffer = await waitWebSocketBinary(this.websocket, this.timeout);
        const serverHandshake = tmcs_msg.TMCSMsg.ServerHandShake.deserializeBinary(buffer);
        const token = openpgp.util.hex_to_Uint8Array(serverHandshake.getToken());

        // Sigin ->
        const sign = await openpgp.sign({
            message: openpgp.message.fromBinary(token),
            privateKeys: [this.prvKey],
            detached: true,
            armor: false
        });
        const signInMsg = new tmcs_msg.TMCSMsg.SignIn();
        signInMsg.setFingerprint(this.pubkey.getFingerprint());
        signInMsg.setToken(serverHandshake.getToken());
        signInMsg.setSign(sign.signature.packets.write());
        this.websocket.send(signInMsg.serializeBinary());

        // <- Comfirm
        buffer = await waitWebSocketBinary(this.websocket, this.timeout);
        const confirm = tmcs_msg.TMCSMsg.ServerHandShake.deserializeBinary(buffer);
        this.state = "pending";
    }
}
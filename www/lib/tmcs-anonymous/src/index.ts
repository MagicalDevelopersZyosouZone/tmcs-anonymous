import * as openpgp from "openpgp";
import tmcs_msg from "tmcs-proto";
import { TMCSError, TMCSMsg, TMCSRPC } from "tmcs-proto";
import { waitWebsocketOpen, readBlob, waitWebSocketMessage, waitWebSocketBinary, promiseOrNot } from "./util";
import { Message, MessageState } from "./message";
import { User } from "./user";
import { Session } from "./session";
import { PromiseEventTrigger } from "./event";

export * from "./message";
export * from "./user";
export * from "./session";

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
interface ServerResponse<T = any>
{
    error: number;
    msg: string;
    data: T;
}
export default class TMCSAnonymous
{
    user: User;
    sessions: Session[] = [];
    contacts: Map<string, User> = new Map();
    remoteAddress: string;
    useSSL: boolean;
    websocket: WebSocket;
    state: "none" | "registed" | "pending" | "ready" | "disconnected" = "none";
    timeout: 3000;
    inviteLink = "";
    onNewSession = new PromiseEventTrigger<Session>();
    onContactRequest = new PromiseEventTrigger<User, boolean>();
    private messageArchive: Message[] = [null];
    private packageArchive: TMCSMsg.SignedMsg[] = [null];
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
        this.user = new User((await openpgp.key.readArmored(pubkeyArmored)).keys[0])
        if (prvkeyArmored)
            this.user.prvkey = (await openpgp.key.readArmored(prvkeyArmored)).keys[0];
    }
    async generateKey(options: KeyOptions = {}): Promise<[openpgp.key.Key, openpgp.key.Key]>
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
        return [this.user.pubkey, this.user.prvkey];
    }
    async registerKey(): Promise<string>
    {
        const registerParam: RegisterParam = {
            name: "Anonymous",
            pubkey: this.user.pubkey.armor(),
            sign: openpgp.util.Uint8Array_to_b64(await this.sign(openpgp.util.hex_to_Uint8Array(this.user.pubkey.getFingerprint()))),
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
        if (result.data.pubkey !== "")
        {
            return result.data.pubkey;
        }
        else if (result.data.link !== "")
        {
            this.inviteLink = `${this.httpBaseAddr}/chat/${result.data.link}`;
            return this.inviteLink;
        }
        return null;
    }
    async sign(buffer: Uint8Array)
    {
        const sign = await openpgp.sign({
            message: openpgp.message.fromBinary(buffer),
            privateKeys: [this.user.prvkey],
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
            privateKeys: [this.user.prvkey],
            detached: true,
            armor: false
        });
        const signInMsg = new tmcs_msg.TMCSMsg.SignIn();
        signInMsg.setFingerprint(this.user.pubkey.getFingerprint());
        signInMsg.setToken(serverHandshake.getToken());
        signInMsg.setSign(sign.signature.packets.write());
        this.websocket.send(signInMsg.serializeBinary());

        // <- Comfirm
        buffer = await waitWebSocketBinary(this.websocket, this.timeout);
        const confirm = tmcs_msg.TMCSMsg.ServerHandShake.deserializeBinary(buffer);
        this.state = "pending";

        this.websocket.onmessage = (ev) => this.handle(ev);
    }

    private async handle(ev: MessageEvent)
    {
        try
        {
            const buffer = await readBlob(ev.data);
            const signedMsg = tmcs_msg.TMCSMsg.SignedMsg.deserializeBinary(buffer);
            switch (signedMsg.getType())
            {
                case tmcs_msg.TMCSMsg.SignedMsg.Type.ERROR:
                    const err = TMCSError.Error.deserializeBinary(signedMsg.getBody_asU8());
                    this.errorHandler(err);
                    return;
                case TMCSMsg.SignedMsg.Type.MESSAGE:
                    const msgPack = TMCSMsg.MessagePack.deserializeBinary(signedMsg.getBody_asU8());
                    this.msgHandler(msgPack, signedMsg.getSender());
                    return;
                case TMCSMsg.SignedMsg.Type.RECEIPT:
                    const receiptPack = TMCSMsg.ReceiptPack.deserializeBinary(signedMsg.getBody_asU8());
                    this.receiptHandler(receiptPack);
                    return;
                default:
                    throw new Error("Received invalid messge.");
            }
        }
        catch (err)
        {
            console.error(err);
        }

    }

    private errorHandler(err: TMCSError.Error)
    {
        console.error(`Server error: ${err.getCode()}: ${err.getMessage()}`);
    }

    private async msgHandler(msgPack: TMCSMsg.MessagePack, sender :string)
    {
        const messages = msgPack.getMsgList()
            .map(msg => new Message(sender, msg.getReceiver(), msg.getEncryptedmsg_asU8(), msg.getMsgid()));
        
        let usr = this.contacts.get(sender);

        // Treat as contact request
        if (!usr)
        {
            const request = messages[0];
            if (!request)
                throw new Error(`Invalid contact request from {${sender}}`);
            const armored = await request.decrypt(this.user.prvkey);
            const pubkey = (await openpgp.key.readArmored(armored)).keys[0];
            if (!pubkey)
                throw new Error(`Invalid contact request from {${sender}}`);
            await request.decrypt(this.user.prvkey, pubkey);
            if (!request.verified)
                throw new Error(`Unsigned contact request from {${sender}}`);
            
            usr = new User(pubkey);
            if (this.onContactRequest)
            {
                if (!await this.onContactRequest.trigger(usr))
                {
                    this.sendPack(this.genReceipt(messages, TMCSMsg.MsgReceipt.MsgState.REJECT), sender);
                    return;
                }
                this.contacts.set(usr.fingerprint, usr);
                this.sendPack(this.genReceipt(messages), sender);

                let session = new Session(this);
                session.users = [this.user, usr];
                this.sessions.push(session);
                if (this.onNewSession)
                    this.onNewSession.trigger(session);

                return;
            }
            else
            {
                this.sendPack(this.genReceipt(messages, TMCSMsg.MsgReceipt.MsgState.LOST), sender);
                throw new Error(`Unhandled contact request from {${sender}}`);
            }
                
        }

        // Send receipts
        this.sendPack(this.genReceipt(messages), sender);

        messages.forEach(msg =>
        {
            let session = this.sessions.filter(session => session.users.some(usr => usr.fingerprint === msg.sender))[0];
            if (!session)
            {
                session = new Session(this);
                session.users = [this.user, usr];
                this.sessions.push(session);
                this.onNewSession.trigger(session);
            }
            session.messages.push(msg);
            session.onMessage.trigger(msg);
        });
    }
    private receiptHandler(receipts: TMCSMsg.ReceiptPack)
    {
        receipts.getReceiptsList().forEach(receipt =>
        {
            const msg = this.messageArchive[receipt.getMsgid()];
            if (msg)
            {
                msg.state = receipt.getState() as any as MessageState;
                msg.onStateChange.trigger(msg.state);
            }
        });
    }

    async contactRequest(pubkey: string): Promise<boolean>
    {
        return new Promise(async (resolve, reject) =>
        {
            const key = await openpgp.key.readArmored(pubkey);
            const user = new User(key.keys[0]);
            this.contacts.set(user.fingerprint, user);
            const msg = new Message(this.user.fingerprint, user.fingerprint, this.user.pubkey.armor());
            msg.onStateChange.on((state) =>
            {
                if (state === MessageState.Received)
                {
                    resolve(true);
                    
                    const session = new Session(this);
                    session.users = [this.user, user];
                    this.sessions.push(session);
                    this.onNewSession.trigger(session);
                }
                else
                    resolve(false);
            });
            await msg.encrypt(user.pubkey, this.user.prvkey)
            await this.send(msg);
        });
    }

    async send(message: Message)
    {
        message.msgId = this.messageArchive.length++;
        this.messageArchive[message.msgId] = message;
        await message.encrypt(this.contacts.get(message.receiver).pubkey, this.user.prvkey);

        const msg = new TMCSMsg.Message();
        msg.setEncryptedmsg(message.rawBody);
        msg.setMsgid(message.msgId);
        msg.setReceiver(message.receiver);
        msg.setTimestamp(message.time.getTime());
        const msgPack = new TMCSMsg.MessagePack();
        msgPack.setMsgList([msg]);
        await this.sendPack(msgPack, message.receiver);
    }

    async getSessionKey(): Promise<string>
    {
        try
        {
            const response = (await fetch(`${this.httpBaseAddr}/key`).then(r => r.json())) as ServerResponse<string>;
            if (response.error !== tmcs_msg.TMCSError.ErrorCode.NONE)
                return null;
            return response.data;
        }
        catch
        {
            return null;
        }
    }

    private async sendPack(pack: TMCSMsg.ReceiptPack | TMCSMsg.MessagePack, receiver: string)
    {
        const signedMsg = new TMCSMsg.SignedMsg();
        signedMsg.setId(this.packageArchive.length++);
        this.packageArchive[signedMsg.getId()] = signedMsg;
        signedMsg.setReceiver(receiver);
        signedMsg.setSender(this.user.pubkey.getFingerprint());
        if (pack instanceof TMCSMsg.ReceiptPack)
        {
            const buffer = pack.serializeBinary();
            const sign = await openpgp.sign({
                message: openpgp.message.fromBinary(buffer),
                privateKeys: [this.user.prvkey],
                armor: false,
                detached: true,
            });
            signedMsg.setType(TMCSMsg.SignedMsg.Type.RECEIPT);
            signedMsg.setBody(buffer);
            signedMsg.setSign(sign.signature.packets.write());
        }
        else if (pack instanceof TMCSMsg.MessagePack)
        {
            const buffer = pack.serializeBinary();
            const sign = await openpgp.sign({
                message: openpgp.message.fromBinary(buffer),
                privateKeys: [this.user.prvkey],
                armor: false,
                detached: true,
            });
            signedMsg.setType(TMCSMsg.SignedMsg.Type.MESSAGE);
            signedMsg.setBody(buffer);
            signedMsg.setSign(sign.signature.packets.write());
        }
        const buffer = signedMsg.serializeBinary();
        this.websocket.send(buffer);
    }

    private genReceipt(messages: Message[], state: TMCSMsg.MsgReceipt.MsgState = TMCSMsg.MsgReceipt.MsgState.RECEIVED)
    {
        const pack = new TMCSMsg.ReceiptPack();
        pack.setReceiptsList(messages.map(msg =>
        {
            const receipt = new TMCSMsg.MsgReceipt();
            receipt.setMsgid(msg.msgId);
            receipt.setState(state);
            return receipt;
        }));
        return pack;
    }
}
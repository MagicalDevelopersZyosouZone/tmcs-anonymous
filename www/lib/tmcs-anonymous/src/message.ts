import * as openpgp from "openpgp";
import { TMCSMsg } from "tmcs-proto";
import { PromiseEventTrigger } from "./event";

export enum MessageState
{
    Pending = TMCSMsg.MsgReceipt.MsgState.PENDING,
    Sent = TMCSMsg.MsgReceipt.MsgState.SENT,
    Lost = TMCSMsg.MsgReceipt.MsgState.LOST,
    Received = TMCSMsg.MsgReceipt.MsgState.RECEIVED,
    Reject = TMCSMsg.MsgReceipt.MsgState.REJECT,
    Timeout = TMCSMsg.MsgReceipt.MsgState.TIMEOUT,
    Failed = TMCSMsg.MsgReceipt.MsgState.FAILED,
    VerfifyFailed = TMCSMsg.MsgReceipt.MsgState.VERIFYFAILED,
}

export class Message
{
    msgId: number;
    state: MessageState;
    sender: string;
    receiver: string;
    time: Date;
    body: string;
    rawBody: Uint8Array;
    private _verified = false;
    get verified() { return this._verified }
    get armored(): string { return this.armored as string; }
    onStateChange = new PromiseEventTrigger<MessageState>();

    constructor(sender: string, receiver: string, body: Uint8Array | string, id: number=-1)
    {
        this.msgId = id;
        this.sender = sender;
        this.receiver = receiver;
        if (typeof (body) === "string")
        {
            this.body = body;
        }
        else
        {
            this.rawBody = body;
        }
        this.time = new Date();
    }

    async encrypt(pubkey: openpgp.key.Key, prvkey: openpgp.key.Key)
    {
        const enc = await openpgp.encrypt({
            message: openpgp.message.fromText(this.body),
            armor: false,
            publicKeys: [pubkey],
            privateKeys: [prvkey],
            detached: false,
        });
        this.rawBody = enc.message.packets.write();
        return this.rawBody;
    }

    async decrypt(prvkey: openpgp.key.Key, pubkey?: openpgp.key.Key)
    {
        const dec = await openpgp.decrypt({
            message: await openpgp.message.read(Uint8Array.from(this.rawBody)),
            privateKeys: [prvkey],
            publicKeys: pubkey ? [pubkey] : undefined,
        });
        this.body = dec.data as string;
        if (pubkey)
        {
            this._verified = dec.signatures[0].valid && pubkey.getFingerprint() === this.sender;
        }
        return this.body;
    }
}
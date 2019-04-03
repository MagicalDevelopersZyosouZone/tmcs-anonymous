import openpgp, { message } from "openpgp";
import { TMCSMsg } from "tmcs-proto";

export enum MessageState
{
    Pending = -2,
    Sended = -1,
    Lost = TMCSMsg.MsgReceipt.MsgState.LOST,
    Received = TMCSMsg.MsgReceipt.MsgState.RECEIVED,
    Reject = TMCSMsg.MsgReceipt.MsgState.REJECT,
    Timeout = TMCSMsg.MsgReceipt.MsgState.TIMEOUT,
    Failed = TMCSMsg.MsgReceipt.MsgState.VERIFYFAILED,
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
    message: openpgp.message.Message;
    get armored(): string { return this.armored as string; }
    onStateChange: (state: MessageState) => void;

    constructor(sender: string, receiver: string, body: Uint8Array | string, id: number=-1)
    {
        this.msgId = id;
        this.sender = sender;
        this.receiver = receiver;
        if (typeof (body) === "string")
        {
            this.body = body;
            this.message = openpgp.message.fromText(body);
        }
        else
        {
            this.rawBody = body;
            this.message = openpgp.message.fromBinary(body);
        }
    }

    async encrypt(pubkey: openpgp.key.Key, prvkey: openpgp.key.Key)
    {
        const enc = await openpgp.encrypt({
            message: this.message,
            armor: false,
            publicKeys: [pubkey],
            privateKeys: [prvkey],
            detached: false,
        });
        this.rawBody = enc.message.packets.write();
        return this.rawBody;
    }

    async decrypt(prvkey: openpgp.key.Key)
    {
        const dec = await openpgp.decrypt({
            message: this.message,
            privateKeys: [prvkey],
        });
        this.body = openpgp.util.decode_utf8(dec.data as Uint8Array) as string;
        return this.body;
    }

    async verify(pubkey: openpgp.key.Key)
    {
        const ver = await openpgp.verify({
            message: this.message,
            publicKeys: [pubkey]
        });
        return ver.signatures[0].valid;
    }
}
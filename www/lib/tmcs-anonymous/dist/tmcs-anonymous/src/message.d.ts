import * as openpgp from "openpgp";
import { PromiseEventTrigger } from "./event";
export declare enum MessageState {
    Pending = 262144,
    Sent = 262145,
    Lost = 1,
    Received = 524288,
    Reject = 8,
    Timeout = 2,
    Failed = 0,
    VerfifyFailed = 4
}
export declare class Message {
    msgId: number;
    state: MessageState;
    sender: string;
    receiver: string;
    time: Date;
    body: string;
    rawBody: Uint8Array;
    private _verified;
    readonly verified: boolean;
    readonly armored: string;
    onStateChange: PromiseEventTrigger<MessageState, any>;
    constructor(sender: string, receiver: string, body: Uint8Array | string, id?: number);
    encrypt(pubkey: openpgp.key.Key, prvkey: openpgp.key.Key): Promise<Uint8Array>;
    decrypt(prvkey: openpgp.key.Key, pubkey?: openpgp.key.Key): Promise<string>;
}

import * as openpgp from "openpgp";
export declare enum MessageState {
    Pending = -2,
    Sended = -1,
    Lost = 0,
    Received = 1,
    Reject = 8,
    Timeout = 2,
    Failed = 4
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
    onStateChange: (state: MessageState) => void;
    constructor(sender: string, receiver: string, body: Uint8Array | string, id?: number);
    encrypt(pubkey: openpgp.key.Key, prvkey: openpgp.key.Key): Promise<Uint8Array>;
    decrypt(prvkey: openpgp.key.Key, pubkey?: openpgp.key.Key): Promise<string>;
}

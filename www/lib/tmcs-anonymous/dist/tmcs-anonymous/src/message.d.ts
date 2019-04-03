import openpgp from "openpgp";
export declare class Message {
    msgId: number;
    sender: string;
    receiver: string;
    time: Date;
    body: string;
    rawBody: Uint8Array;
    message: openpgp.message.Message;
    readonly armored: string;
    constructor(sender: string, receiver: string, body: Uint8Array | string, id?: number);
    encrypt(pubkey: openpgp.key.Key, prvkey: openpgp.key.Key): Promise<Uint8Array>;
    decrypt(prvkey: openpgp.key.Key): Promise<string>;
    verify(pubkey: openpgp.key.Key): Promise<boolean>;
}

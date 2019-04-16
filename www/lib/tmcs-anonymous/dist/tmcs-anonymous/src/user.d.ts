import * as openpgp from "openpgp";
import { Message } from "./message";
export declare class User {
    pubkey: openpgp.key.Key;
    prvkey: openpgp.key.Key;
    messages: Message[];
    keyid: string;
    readonly fingerprint: string;
    readonly name: string;
    readonly email: string;
    constructor(pubkey: openpgp.key.Key, prvkey?: openpgp.key.Key);
}

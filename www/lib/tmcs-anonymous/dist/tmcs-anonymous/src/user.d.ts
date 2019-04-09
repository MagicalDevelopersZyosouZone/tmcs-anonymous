import * as openpgp from "openpgp";
import { Message } from "./message";
export declare class User {
    pubkey: openpgp.key.Key;
    prvkey: openpgp.key.Key;
    messages: Message[];
    readonly fingerprint: string;
    readonly name: string;
    readonly email: string;
    constructor(name: string, pubkey: openpgp.key.Key, prvkey?: openpgp.key.Key);
}

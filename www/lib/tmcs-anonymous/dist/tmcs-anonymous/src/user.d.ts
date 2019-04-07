import openpgp from "openpgp";
import { Message } from "./message";
export declare class User {
    pubkey: openpgp.key.Key;
    prvkey: openpgp.key.Key;
    name: string;
    messages: Message[];
    readonly fingerprint: string;
    constructor(name: string, pubkey: openpgp.key.Key, prvkey?: openpgp.key.Key);
}

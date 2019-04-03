import openpgp from "openpgp";
import { Message } from "./message";

export class User
{
    pubkey: openpgp.key.Key;
    prvkey: openpgp.key.Key;
    name: string;
    messages: Message[] = [];
    get fingerprint(): string { return this.pubkey.getFingerprint() }

    constructor(name: string, pubkey: openpgp.key.Key, prvkey: openpgp.key.Key = null)
    {
        this.name = name;
        this.pubkey = pubkey;
        this.prvkey = prvkey;
    }
}
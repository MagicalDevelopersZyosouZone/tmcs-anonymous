import * as openpgp from "openpgp";
import { Message } from "./message";

export class User
{
    pubkey: openpgp.key.Key;
    prvkey: openpgp.key.Key;
    messages: Message[] = [];
    keyid: string;
    get fingerprint(): string { return this.pubkey.getFingerprint() }
    get name(): string { return openpgp.util.parseUserId(this.keyid).name }
    get email(): string { return openpgp.util.parseUserId(this.keyid).email }

    constructor(pubkey: openpgp.key.Key, prvkey: openpgp.key.Key = null)
    {
        this.keyid = pubkey.getUserIds()[0];
        this.pubkey = pubkey;
        this.prvkey = prvkey;
    }
}
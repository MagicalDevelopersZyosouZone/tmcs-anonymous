import * as openpgp from "openpgp";
import { Message } from "./message";

export class User
{
    pubkey: openpgp.key.Key;
    prvkey: openpgp.key.Key;
    messages: Message[] = [];
    userid: string;

    get keyid(): string { return this.pubkey.getFingerprint().substr(32).toUpperCase() }
    get fingerprint(): string { return this.pubkey.getFingerprint() }
    get name(): string { return openpgp.util.parseUserId(this.userid).name }
    get email(): string { return openpgp.util.parseUserId(this.userid).email }

    constructor(pubkey: openpgp.key.Key, prvkey: openpgp.key.Key = null)
    {
        this.userid = pubkey.getUserIds()[0];
        this.pubkey = pubkey;
        this.prvkey = prvkey;
    }
}
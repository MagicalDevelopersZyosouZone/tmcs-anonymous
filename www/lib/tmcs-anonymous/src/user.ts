import * as openpgp from "openpgp";
import { Message } from "./message";

export class User
{
    pubkey: openpgp.key.Key;
    prvkey: openpgp.key.Key;
    messages: Message[] = [];
    get fingerprint(): string { return this.pubkey.getFingerprint() }
    get name(): string { return openpgp.util.parseUserId(this.pubkey.getUserIds()[0]).name }
    get email(): string { return openpgp.util.parseUserId(this.pubkey.getUserIds()[0]).email }

    constructor(name: string, pubkey: openpgp.key.Key, prvkey: openpgp.key.Key = null)
    {
        openpgp.generateKey({
            userIds:[{
                name: "name <email@email> ",
                email: "email@example.com"
            }]
        })
        this.pubkey = pubkey;
        this.prvkey = prvkey;
    }
}
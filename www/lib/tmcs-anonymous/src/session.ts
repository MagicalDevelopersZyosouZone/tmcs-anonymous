import { User } from "./user";
import { Message } from "./message";
import TMCSAnonymous from ".";

export class Session
{
    users: User[] = [];
    messages: Message[] = [];
    onmessage: (msg: Message) => void;

    private tmcs: TMCSAnonymous;

    constructor(tmcs: TMCSAnonymous)
    {
        this.tmcs = tmcs;
    }

    async send(text: string)
    {
        await Promise.all(this.users.filter(usr => usr !== this.tmcs.user).map(async (usr) =>
        {
            const msg = new Message(this.tmcs.user.fingerprint, usr.fingerprint, text);
            msg.time = new Date();
            await this.tmcs.send(msg);
        }));
    }
}
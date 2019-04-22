import { User } from "./user";
import { Message, MessageState } from "./message";
import TMCSAnonymous from ".";
import { PromiseEventTrigger } from "./event";

export class Session
{
    name: string;
    users: User[] = [];
    messages: Message[] = [];
    onMessage = new PromiseEventTrigger<Message>();

    private tmcs: TMCSAnonymous;

    constructor(tmcs: TMCSAnonymous, name: string)
    {
        this.name = name;
        this.tmcs = tmcs;
    }

    async send(text: string)
    {
        const message = new Message(this.tmcs.user.fingerprint, null, text);
        message.state = MessageState.Pending;
        const msgs = this.users.filter(usr => usr !== this.tmcs.user).map( (usr) =>
        {
            const msg = new Message(this.tmcs.user.fingerprint, usr.fingerprint, text);
            msg.time = new Date();
            return msg;
        });

        // Handle State
        setTimeout(() =>
        {
            (async () =>
            {
                try
                {
                    await Promise.all(msgs.map((msg) =>
                    {
                        return new Promise((resolve, reject) =>
                        {
                            msg.onStateChange.on(state =>
                            {
                                if (state & MessageState.Received)
                                    resolve();
                                else if (!(state & MessageState.Pending))
                                    reject();
                            });
                        });
                    }));
                    message.state = MessageState.Received;
                    message.onStateChange.trigger(MessageState.Received);
                }
                catch
                {
                    message.state = MessageState.Failed;
                    message.onStateChange.trigger(message.state);
                }
            })();

            // Send
            (async () =>
            {
                await Promise.all(msgs.map(async (msg) =>
                {
                    await this.tmcs.send(msg);
                }));
            })();
        }, 10);
        this.messages.push(message);
        this.onMessage.trigger(message);
        return message;
    }
}
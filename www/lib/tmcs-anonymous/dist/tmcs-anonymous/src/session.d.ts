import { User } from "./user";
import { Message } from "./message";
import TMCSAnonymous from ".";
import { PromiseEventTrigger } from "./event";
export declare class Session {
    users: User[];
    messages: Message[];
    onMessage: PromiseEventTrigger<Message, any>;
    private tmcs;
    constructor(tmcs: TMCSAnonymous);
    send(text: string): Promise<void>;
}

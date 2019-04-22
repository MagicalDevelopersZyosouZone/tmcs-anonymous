import { User } from "./user";
import { Message } from "./message";
import TMCSAnonymous from ".";
import { PromiseEventTrigger } from "./event";
export declare class Session {
    name: string;
    users: User[];
    messages: Message[];
    onMessage: PromiseEventTrigger<Message, any>;
    private tmcs;
    constructor(tmcs: TMCSAnonymous, name: string);
    send(text: string): Promise<Message>;
}

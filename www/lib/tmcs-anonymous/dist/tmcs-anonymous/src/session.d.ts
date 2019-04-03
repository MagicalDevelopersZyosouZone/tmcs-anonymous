import { User } from "./user";
import { Message } from "./message";
import TMCSAnonymous from ".";
export declare class Session {
    users: User[];
    messages: Message[];
    onmessage: (msg: Message) => void;
    private tmcs;
    constructor(tmcs: TMCSAnonymous);
    send(text: string): Promise<void>;
}

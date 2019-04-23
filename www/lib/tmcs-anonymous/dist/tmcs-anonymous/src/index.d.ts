import * as openpgp from "openpgp";
import { WebSocketMessageQueue } from "./util";
import { Message } from "./message";
import { User } from "./user";
import { Session } from "./session";
import { PromiseEventTrigger } from "./event";
export * from "./message";
export * from "./user";
export * from "./session";
interface KeyOptions {
    bits?: 1024 | 2048 | 4096;
    name?: string;
    email?: string;
}
export default class TMCSAnonymous {
    user: User;
    sessions: Session[];
    contacts: Map<string, User>;
    remoteAddress: string;
    useSSL: boolean;
    websocket: WebSocket;
    state: "none" | "registed" | "connecting" | "ready" | "disconnected";
    timeout: 3000;
    inviteLink: string;
    onNewSession: PromiseEventTrigger<Session, any>;
    onContactRequest: PromiseEventTrigger<User, boolean>;
    msgQueue: WebSocketMessageQueue;
    private messageArchive;
    private packageArchive;
    private readonly httpProtocol;
    private readonly wsProtocol;
    private readonly httpBaseAddr;
    constructor(address: string, useSSL?: boolean);
    setkey(pubkeyArmored: string, prvkeyArmored: string): Promise<void>;
    generateKey(options?: KeyOptions): Promise<[openpgp.key.Key, openpgp.key.Key]>;
    registerKey(): Promise<string>;
    sign(buffer: Uint8Array): Promise<Uint8Array>;
    connect(): Promise<void>;
    private msgLoop;
    private handle;
    private errorHandler;
    private msgHandler;
    private receiptHandler;
    contactRequest(pubkey: string): Promise<boolean>;
    send(message: Message): Promise<void>;
    getSessionKey(): Promise<string>;
    private sendPack;
    private genReceipt;
}

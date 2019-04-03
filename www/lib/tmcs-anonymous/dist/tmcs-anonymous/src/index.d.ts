import * as openpgp from "openpgp";
import { Message } from "./message";
import { User } from "./user";
import { Session } from "./session";
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
    state: "none" | "registed" | "pending" | "ready" | "disconnected";
    timeout: 3000;
    onNewSession: (session: Session) => void;
    onContactRequest: (user: User) => boolean | Promise<boolean>;
    private messageArchive;
    private packageArchive;
    private readonly httpProtocol;
    private readonly wsProtocol;
    private readonly httpBaseAddr;
    constructor(address: string, useSSL?: boolean);
    setkey(pubkeyArmored: string, prvkeyArmored: string): Promise<void>;
    generateKey(options?: KeyOptions): Promise<openpgp.key.Key>;
    registerKey(): Promise<string>;
    sign(buffer: Uint8Array): Promise<Uint8Array>;
    connect(): Promise<void>;
    private handle;
    private errorHandler;
    private msgHandler;
    private receiptHandler;
    send(message: Message): Promise<void>;
    private sendPack;
    private genReceipt;
}
export {};

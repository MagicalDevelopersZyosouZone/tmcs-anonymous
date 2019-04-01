import * as openpgp from "openpgp";
interface KeyOptions {
    bits?: 1024 | 2048 | 4096;
    name?: string;
    email?: string;
}
export default class TMCSAnonymous {
    remoteAddress: string;
    useSSL: boolean;
    pubkey: openpgp.key.Key;
    prvKey: openpgp.key.Key;
    websocket: WebSocket;
    state: "none" | "registed" | "pending" | "ready" | "disconnected";
    timeout: 3000;
    private readonly httpProtocol;
    private readonly wsProtocol;
    private readonly httpBaseAddr;
    constructor(address: string, useSSL?: boolean);
    setkey(pubkeyArmored: string, prvkeyArmored: string): Promise<void>;
    generateKey(options?: KeyOptions): Promise<openpgp.key.Key>;
    registerKey(): Promise<string>;
    sign(buffer: Uint8Array): Promise<Uint8Array>;
    connect(): Promise<void>;
}
export {};

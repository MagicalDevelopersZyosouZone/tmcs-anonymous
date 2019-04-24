export declare function waitWebSocketMessage(ws: WebSocket, timeout?: number): Promise<MessageEvent>;
export declare function waitWebsocketOpen(ws: WebSocket): Promise<{}>;
export declare function readBlob(data: Blob): Promise<Uint8Array>;
export declare function waitWebSocketBinary(ws: WebSocket, timeout?: number): Promise<Uint8Array>;
export declare function PromiseTimeout<T>(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void, timeout?: number): Promise<T>;
export declare function promiseOrNot<T>(input: T | Promise<T>): Promise<T>;
export declare class Queue<T> {
    private header;
    private tail;
    private dequeueResolve;
    private dequeueReject;
    private _length;
    readonly length: number;
    enqueue(element: T): void;
    rejectAwaiter(reason: any): void;
    private resolveDequeue;
    private dequeueInternal;
    dequeue(): Promise<T>;
}
export declare class WebSocketMessageQueue {
    queue: Queue<Uint8Array>;
    websocket: WebSocket;
    constructor(websocket: WebSocket);
    update(websocket: WebSocket, reject?: boolean): void;
    private onMessage;
    receive(timeout?: number): Promise<Uint8Array>;
}

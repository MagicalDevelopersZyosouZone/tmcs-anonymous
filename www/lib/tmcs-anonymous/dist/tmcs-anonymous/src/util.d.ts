export declare function waitWebSocketMessage(ws: WebSocket, timeout?: number): Promise<MessageEvent>;
export declare function waitWebsocketOpen(ws: WebSocket): Promise<{}>;
export declare function readBlob(data: Blob): Promise<Uint8Array>;
export declare function waitWebSocketBinary(ws: WebSocket, timeout?: number): Promise<Uint8Array>;
export declare function PromiseTimeout<T>(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void, timeout?: number): Promise<T>;
export declare function promiseOrNot<T>(input: T | Promise<T>): Promise<T>;

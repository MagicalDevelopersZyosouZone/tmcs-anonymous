export async function waitWebSocketMessage(ws: WebSocket, timeout: number = 3000): Promise<MessageEvent>
{
    return PromiseTimeout((resolve) =>
    {
        ws.onmessage = (ev) =>
        {
            ws.onmessage = null;
            resolve(ev);
        }
    }, timeout);
}

export async function waitWebsocketOpen(ws: WebSocket)
{
    return new Promise(resolve =>
    {
        ws.onopen = () =>
        {
            ws.onopen = null;
            resolve();
        }
    })
}

export async function readBlob(data: Blob): Promise<Uint8Array>
{
    return await new Response(data).arrayBuffer() as Uint8Array;
}

export async function waitWebSocketBinary(ws: WebSocket, timeout?: number)
{
    return await waitWebSocketMessage(ws)
        .then(ev => readBlob(ev.data as Blob));
}

export function PromiseTimeout<T>(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void, timeout?:number): Promise<T>
{
    return new Promise((resolve, reject) =>
    {
        if (timeout !== undefined)
        {
            setTimeout(() =>
            {
                reject("Timeout");
            }, timeout);
        }
        executor(resolve, reject);
    });
}

export async function promiseOrNot<T>(input: T | Promise<T>): Promise<T>
{
    if (input instanceof Promise)
        input = await input;
    return input;
}

interface Node<T>
{
    element: T;
    prior: Node<T>;
    next: Node<T>;
}

export class Queue<T>
{
    private header: Node<T>;
    private tail: Node<T>;
    private dequeueResolve: (element: T) => void;
    private dequeueReject: (reason: any) => void;
    private _length = 0;
    get length() { return this._length }
    enqueue(element: T)
    {
        if (!this.header)
            this.header = this.tail = {
                element: element,
                next: null,
                prior: null
            };
        else
        {
            this.tail = {
                element: element,
                prior: this.tail,
                next: null
            };
        }
        if (this.tail.prior)
            this.tail.prior.next = this.tail;
        this._length++;
        this.dequeueResolve && this.resolveDequeue();
    }
    rejectAwaiter(reason: any)
    {
        const reject = this.dequeueReject;
        this.dequeueReject = null;
        this.dequeueResolve = null;
        reject && reject(reason);
        return;
    }
    private async resolveDequeue()
    {
        if (this.dequeueResolve)
        {
            const resolve = this.dequeueResolve;
            this.dequeueResolve = null;
            this.dequeueReject = null;
            await resolve(this.dequeueInternal());
        }
    }
    private dequeueInternal(): T
    {
        var node = this.header;
        this.header = this.header.next;
        if (this.header)
            this.header.prior = null;
        this._length--;
        return node.element;
    }
    async dequeue(): Promise<T>
    {
        return new Promise((resolve, reject) => {
            if (!this.header)
            {
                this.dequeueResolve = resolve;
                this.dequeueReject = reject;
            }
            else
                resolve(this.dequeueInternal())
        });
    }
}

export class WebSocketMessageQueue
{
    queue: Queue<Uint8Array> = new Queue();
    websocket: WebSocket;
    constructor(websocket: WebSocket)
    {
        this.websocket = websocket;
        websocket.addEventListener("message", (e) => this.onMessage(e));
    }
    update(websocket: WebSocket, reject: boolean = false)
    {
        this.websocket = websocket;
        this.websocket.addEventListener("message", (e) => this.onMessage(e));
        if (reject)
            this.queue.rejectAwaiter(new Error("Stop message receiving"));
    }
    private async onMessage(e: MessageEvent)
    {
        this.queue.enqueue(await readBlob(e.data as Blob));
    }
    async receive(timeout?: number)
    {
        return await this.queue.dequeue();
    }
}
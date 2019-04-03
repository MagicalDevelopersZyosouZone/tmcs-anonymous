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
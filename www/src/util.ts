export async function waitWebSocketMessage(ws: WebSocket): Promise<MessageEvent>
{
    return new Promise((resolve) =>
    {
        ws.onmessage = (ev) =>
        {
            ws.onmessage = null;
            resolve(ev);
        }
    })
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

export async function waitWebSocketBinary(ws: WebSocket)
{
    return await waitWebSocketMessage(ws)
        .then(ev => readBlob(ev.data as Blob));
}
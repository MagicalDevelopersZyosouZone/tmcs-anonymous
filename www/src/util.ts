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

export function formatFingerprint(fingerprint: string)
{
    const slice = [];
    for (let i = 0; i < fingerprint.length; i+=4)
    {
        slice.push(fingerprint.substr(i, 4).toUpperCase());
    }
    return slice.join("-");
}

export function sleep(time:number)
{
    return new Promise(resolve => setTimeout(resolve, time));
}

export function buildClassName(...names: any[]): string
{
    return [].concat(...names.filter(name => name).map(name =>
    {
        if (typeof (name) === "string")
            return name.split(" ");
        else if (name instanceof Array)
            return name as string[];
        return [name.toString()];
    })).join(" ");
}
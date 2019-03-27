import { TestPublicKey, TestPrivateKey } from "./pgp-key";
import * as openpgp from "openpgp";
import tmcs_msg from "./proto/tmcs_msg_pb";
import { waitWebSocketMessage, waitWebsocketOpen, readBlob, waitWebSocketBinary } from "./util";
import TMCSAnonymous from "../lib/tmcs-anonymous";

const host = "localhost:5325";
(window as any).openpgp = openpgp;
async function main()
{
    const reg = /session\/([0-9A-Fa-f]+)/;
    if (reg.test(window.location.pathname))
    {
        const client = new TMCSAnonymous(window.location.toString());
        await client.generateKey();
        console.log(client.pubkey.armor());
        console.log(await client.registerKey());
        await client.connect();
        console.log(client.state);
    }
    else
    {
        const client = new TMCSAnonymous(window.location.toString());
        await client.setkey(TestPublicKey, TestPrivateKey);
        const inviteUrl = await client.registerKey();
        console.log(inviteUrl);
        await client.connect();
        console.log(client.state);
    }
}
(window as any).main = main;
main();
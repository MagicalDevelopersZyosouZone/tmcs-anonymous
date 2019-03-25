import { TestPublicKey, TestPrivateKey } from "./pgp-key";
import * as openpgp from "openpgp";
import tmcs_msg from "./proto/tmcs_msg_pb";
import { waitWebSocketMessage, waitWebsocketOpen, readBlob, waitWebSocketBinary } from "./util";
import TMCSAnonymous from "../lib/tmcs-anonymous";

const host = "localhost:5325";
(window as any).openpgp = openpgp;
async function main()
{
    const client = new TMCSAnonymous("http://localhost:5325");
    await client.setkey(TestPublicKey, TestPrivateKey);
    const inviteUrl = await client.registerKey();
    console.log(inviteUrl);
    await client.connect();
    console.log(client.state);
}
(window as any).main = main;
main();
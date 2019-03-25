import { TestPublicKey, TestPrivateKey } from "./pgp-key";
import * as openpgp from "openpgp";
import tmcs_msg from "./proto/tmcs_msg_pb";
import { waitWebSocketMessage, waitWebsocketOpen, readBlob, waitWebSocketBinary } from "./util";

const host = "localhost:5325";
(window as any).openpgp = openpgp;
async function main()
{
    
    const pubkey = (await openpgp.key.readArmored(TestPublicKey)).keys[0];
    const prvkey = (await openpgp.key.readArmored(TestPrivateKey)).keys[0];
    (window as any).pubkey = pubkey;
    (window as any).prvkey = prvkey;
    const fingerPrint = openpgp.util.hex_to_Uint8Array(pubkey.getFingerprint());
    let sign = await openpgp.sign({
        message: openpgp.message.fromBinary(fingerPrint),
        detached: true,
        armor: false,
        privateKeys: [prvkey],
    });
    const registerObj = {
        pubkey: TestPublicKey,
        sign: openpgp.util.Uint8Array_to_b64(sign.signature.packets.write())
    };

    let result = await fetch(`http://${host}/key/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-cache",
        body: JSON.stringify(registerObj)
    }).then(response => response.json());
    console.log(result);
    if (result.error !== 0)
        return;
    console.log(`http://${host}/chat/${result.data}`);
    fetch(`http://${host}/chat/${result.data}`);

    // Connect
    let alice = new WebSocket(`ws://${host}/ws`);
    await waitWebsocketOpen(alice);

    // Handshake ->
    const handshake = new tmcs_msg.ClientHandShake();
    handshake.setClientversion(1);
    alice.send(handshake.serializeBinary());

    // <- Handshake
    let msg = await waitWebSocketMessage(alice);
    let buffer = await readBlob(msg.data as Blob);
    const serverHandshake = tmcs_msg.ServerHandShake.deserializeBinary(buffer);
    let token = openpgp.util.hex_to_Uint8Array(serverHandshake.getToken())

    // Sigin ->
    sign = await openpgp.sign({
        message: openpgp.message.fromBinary(token),
        privateKeys: [prvkey],
        detached: true,
        armor: false
    });
    const signInMsg = new tmcs_msg.SignIn();
    signInMsg.setFingerprint(pubkey.getFingerprint());
    signInMsg.setToken(serverHandshake.getToken());
    signInMsg.setSign(sign.signature.packets.write());
    alice.send(signInMsg.serializeBinary());
    buffer = await waitWebSocketBinary(alice);
    const confirm = tmcs_msg.ServerHandShake.deserializeBinary(buffer);
    if (confirm.getToken() === serverHandshake.getToken())
    {
        console.log("Connected.");
    }

    var x = 0;
}
(window as any).main = main;
main();
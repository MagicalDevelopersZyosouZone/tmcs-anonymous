const openpgp = require("openpgp");
const fetch = require("node-fetch");
const { TestPublicKey, TestPrivateKey } = require("./pgp-key");

const host="http://localhost:5325/"

async function main()
{
    const pubkey = (await openpgp.key.readArmored(TestPublicKey)).keys[0];
    const prvkey = (await openpgp.key.readArmored(TestPrivateKey)).keys[0];
    const fingerPrint = openpgp.util.hex_to_Uint8Array(pubkey.getFingerprint());
    const sign = await openpgp.sign({
        message: openpgp.message.fromBinary(fingerPrint),
        detached: true,
        armor: false,
        privateKeys: [prvkey],
    });
    const registerObj = {
        pubkey: TestPublicKey,
        sign: openpgp.util.Uint8Array_to_b64(sign.signature.packets.write())
    };

    result = await fetch(host + "user/register", {
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
    
    let alice = new WebSocket(host + "ws");
    alice.onmessage = (ev) =>
    {
        console.log(ev.data);  
    };
}
main();
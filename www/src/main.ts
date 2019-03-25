import { TestPublicKey, TestPrivateKey } from "./pgp-key";
import * as openpgp from "openpgp";

const host = "http://localhost:5325/";
(window as any).openpgp = openpgp;
async function main()
{
    
    const pubkey = (await openpgp.key.readArmored(TestPublicKey)).keys[0];
    const prvkey = (await openpgp.key.readArmored(TestPrivateKey)).keys[0];
    (window as any).pubkey = pubkey;
    (window as any).prvkey = prvkey;
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

    let result = await fetch(host + "user/register", {
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
    
}
(window as any).main = main;
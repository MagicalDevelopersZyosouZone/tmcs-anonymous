const openpgp = require("openpgp")
const { TestPublicKey, TestPrivateKey } = require("./pgp-key");

describe("API Test", () => {
    it("HTTP API", async () => {
        const pubkey = (await openpgp.key.readArmored(TestPublicKey)).keys[0];
        const prvkey = (await openpgp.key.readArmored(TestPrivateKey)).keys[0];
        const fingerPrint = openpgp.util.hex_to_Uint8Array(pubkey.getFingerprint());
        const sign = await openpgp.sign({
            message: openpgp.message.fromBinary(fingerPrint),
            detached: true,
            armor: false,
            privateKeys: [prvkey],
        });
        const obj = {
            pubkey: TestPublicKey,
            sign: openpgp.util.Uint8Array_to_b64(sign.signature.packets.write())
        }
        console.log(JSON.stringify(obj))
    });
});
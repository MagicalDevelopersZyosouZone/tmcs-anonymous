const openpgp = require("openpgp");
const protobuf = require("protobufjs");
const tmcsMsg = require("../src/proto/tmcs_msg_pb");
const { expect } = require("chai");
const { TestPublicKey, TestPrivateKey } = require("./pgp-key");
const linq = require("linq");

function foo({ bar, baz }) {
    foo(bar, baz);
    foo({
        bar: bar,
        baz: baz
    });
}

describe("OpenPGP.js", () => {
    /*openpgp.generateKey({
        userIds: [{
            name: "Anonymous",
            email: "anonymous@mdzz.studio",
        }],
        numBits: 2048,
    }).then((key) => {
        console.log(key.publicKeyArmored);
        console.log(key.privateKeyArmored);
    });*/

    it("Key binary", async () => {
        const pubkey = (await openpgp.key.readArmored(TestPublicKey)).keys[0];
        const prvKey = (await openpgp.key.readArmored(TestPrivateKey)).keys[0];
        //console.log(openpgp.util.Uint8Array_to_b64(pubkey.toPacketlist().write()))
        
    });
    
    it("Encrypt & Decrypt text", async () => {
        const pubkey = (await openpgp.key.readArmored(TestPublicKey)).keys[0];
        const prvKey = (await openpgp.key.readArmored(TestPrivateKey)).keys[0];
        const data = "A MESSAGE TEST\n";
        let enc = await openpgp.encrypt({
            publicKeys: pubkey,
            message: openpgp.message.fromText(data),
            privateKeys: [prvKey],
            detached: false,
            armor: false
        });

        // write to binary & read from binary
        bin = enc.message.packets.write();
        const msg = await openpgp.message.read(openpgp.util.b64_to_Uint8Array(openpgp.util.Uint8Array_to_b64(bin)));

        //console.log(msg.verify([pubkey]));

        let dec = await openpgp.decrypt({
            message: msg,
            publicKeys: [pubkey],
            privateKeys: [prvKey],
        });
        expect(dec.signatures.every(sign => sign.valid === true)).be.equal(true);
        expect(dec.data).equal(data);
    });

    it("Binary encrypt/decrypt/sign test", async () => {
        const pubkey = (await openpgp.key.readArmored(TestPublicKey)).keys[0];
        const prvKey = (await openpgp.key.readArmored(TestPrivateKey)).keys[0];
        const data = new Uint8Array([1, 1, 4, 5, 1, 4, 1, 9, 1, 9]);
        const enc = await openpgp.encrypt({
            publicKeys: pubkey,
            message: openpgp.message.fromBinary(data),
            privateKeys: [prvKey],
            detached: false,
            armor: false
        });

        const bin = enc.message.packets.write();
        const encrypedMsg = await openpgp.message.read(bin);

        const dec = await openpgp.decrypt({
            message: encrypedMsg,
            privateKeys: [prvKey],
            publicKeys: [pubkey]
        });
        expect(dec.signatures.every(sign => sign.valid === true)).be.equal(true);
        expect(openpgp.util.str_to_Uint8Array(dec.data)).deep.equal(data);

    });

    it("Clear text sign", async () => {
        const pubkey = (await openpgp.key.readArmored(TestPublicKey)).keys[0];
        const prvKey = (await openpgp.key.readArmored(TestPrivateKey)).keys[0];

        const data = new Uint8Array([1, 1, 4, 5, 1, 4, 1, 9, 1, 9]);

        let options = {
            message: openpgp.message.fromBinary(data),
            privateKeys: [prvKey],                            // for signing
            detached: true
        };
        const detachedSig = await openpgp.sign(options);

        options = {
            message: openpgp.message.fromBinary(data),        // CleartextMessage or Message object
            signature: await openpgp.signature.readArmored(detachedSig.signature), // parse detached signature
            publicKeys: [pubkey]
        };

        await openpgp.verify(options).then(function (verify) {
            expect(verify.signatures.every(v => v.valid)).be.equal(true);
            expect(verify.signatures[0].keyid).deep.equal(pubkey.primaryKey.getKeyId())
        });
    });

    it("Binary sign", async () => {
        const pubkey = (await openpgp.key.readArmored(TestPublicKey)).keys[0];
        const prvKey = (await openpgp.key.readArmored(TestPrivateKey)).keys[0];
        const data = new Uint8Array([1, 1, 4, 5, 1, 4, 1, 9, 1, 9]);

        const sign = await openpgp.sign({
            message: openpgp.message.fromBinary(data),
            privateKeys: [prvKey],
            detached: true,
            armor:false,
        });

        //console.log(openpgp.util.Uint8Array_to_b64(sign.signature.packets.write()));
        
        await openpgp.verify({
            message: openpgp.message.fromBinary(data),
            signature: await openpgp.signature.read(sign.signature.packets.write()),
            publicKeys: [pubkey],
        }).then(async (verify) => {
            for (const sign of verify.signatures) {
                expect(await sign.verified).be.equal(true);
            }
            expect(verify.signatures[0].keyid).deep.equal(pubkey.primaryKey.getKeyId())
        });
    })
});

describe("Proto buf", () => {
    it("load .proto", () => {
        let msg = new tmcsMsg.NewSession();
        msg.setGroup(false);
        msg.setPubkey("PUBLIC KEY");
        msg.setLifetime(30000);
        let buffer = msg.serializeBinary();
        //console.log(openpgp.util.Uint8Array_to_b64(buffer));
        msg = tmcsMsg.NewSession.deserializeBinary(buffer);
        expect(msg.getPubkey()).be.equal("PUBLIC KEY");
    });
    
    it("Protobuf from Go", () => {
        let buffer = openpgp.util.b64_to_Uint8Array("ChNQVUJMSUMgS0VZIEZST00gR08hELgX");
        let msg = tmcsMsg.NewSession.deserializeBinary(buffer);
        expect(msg.getPubkey()).be.equal("PUBLIC KEY FROM GO!")
    });
});

describe("Protobuf & OpenPGPJs", () => {
    it("obj -> binary -> encrypted -> binary -> obj", async () => {
        const pubkey = (await openpgp.key.readArmored(TestPublicKey)).keys[0];
        const prvKey = (await openpgp.key.readArmored(TestPrivateKey)).keys[0];
        let msg = new tmcsMsg.NewSession();
        msg.setGroup(false);
        msg.setPubkey("PUBLIC KEY");
        msg.setLifetime(30000);

        let buffer = msg.serializeBinary();

        const encryptedBinary = (await openpgp.encrypt({
            message: openpgp.message.fromBinary(buffer),
            publicKeys: pubkey,
            armor: false
        })).message.packets.write();

        const decryptedBinary = openpgp.util.str_to_Uint8Array((await openpgp.decrypt({
            message: await openpgp.message.read(encryptedBinary),
            privateKeys: prvKey
        })).data);

        let msgDeserialized = tmcsMsg.NewSession.deserializeBinary(decryptedBinary);
        expect(msgDeserialized.getPubkey()).be.equal(msg.getPubkey());

    });

    it("Signed Protobuf",async () => {
        const pubkey = (await openpgp.key.readArmored(TestPublicKey)).keys[0];
        const prvKey = (await openpgp.key.readArmored(TestPrivateKey)).keys[0];
        let msg = new tmcsMsg.NewSession();
        msg.setGroup(true);
        msg.setPubkey("PUBLIC KEY");
        msg.setLifetime(30000);

        let buffer = msg.serializeBinary();

        let signedMsg = new tmcsMsg.SignedMsg();
        signedMsg.setBody(buffer);

        const sign = await openpgp.sign({
            message: openpgp.message.fromBinary(buffer),
            privateKeys: [prvKey],
            detached: true,
        });

        signedMsg.setSign(sign.signature);
        signedMsg.setReceiver(openpgp.util.Uint8Array_to_hex(pubkey.primaryKey.fingerprint))

        buffer = signedMsg.serializeBinary();

        console.log(openpgp.util.Uint8Array_to_b64(buffer))

        let obj = tmcsMsg.SignedMsg.deserializeBinary(openpgp.util.b64_to_Uint8Array(openpgp.util.Uint8Array_to_b64(buffer)));
        console.log(obj.getReceiver())

        bj = tmcsMsg.SignedMsg.deserializeBinary(openpgp.util.b64_to_Uint8Array("RS0tLS0tDQo=cFhCLzg9DQo9bm9saA0KLS0tLS1FTkQgUEdQIFNJR05BVFVS"));
        console.log(obj.getReceiver())

        //console.log(tmcsMsg.SignedMsg.deserializeBinary(openpgp.util.b64_to_Uint8Array("RS0tLS0tDQo=dGtoRUE9DQo9R1ExeQ0KLS0tLS1FTkQgUEdQIFNJR05BVFVS")).getSign())
        
    });
});

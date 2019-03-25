
const { TestPublicKey } = require("./pgp-key")

const obj = {
    pubkey: TestPublicKey,
    sign:""
}
console.log(JSON.stringify(obj))
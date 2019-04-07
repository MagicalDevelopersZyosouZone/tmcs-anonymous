"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class User {
    constructor(name, pubkey, prvkey = null) {
        this.messages = [];
        this.name = name;
        this.pubkey = pubkey;
        this.prvkey = prvkey;
    }
    get fingerprint() { return this.pubkey.getFingerprint(); }
}
exports.User = User;
//# sourceMappingURL=user.js.map
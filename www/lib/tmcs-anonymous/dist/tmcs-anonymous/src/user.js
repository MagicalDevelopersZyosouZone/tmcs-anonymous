"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const openpgp = __importStar(require("openpgp"));
class User {
    constructor(name, pubkey, prvkey = null) {
        this.messages = [];
        openpgp.generateKey({
            userIds: [{
                    name: "name <email@email> ",
                    email: "email@example.com"
                }]
        });
        this.pubkey = pubkey;
        this.prvkey = prvkey;
    }
    get fingerprint() { return this.pubkey.getFingerprint(); }
    get name() { return openpgp.util.parseUserId(this.pubkey.getUserIds()[0]).name; }
    get email() { return openpgp.util.parseUserId(this.pubkey.getUserIds()[0]).email; }
}
exports.User = User;
//# sourceMappingURL=user.js.map
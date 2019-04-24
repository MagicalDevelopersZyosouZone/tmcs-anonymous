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
    constructor(pubkey, prvkey = null) {
        this.messages = [];
        this.userid = pubkey.getUserIds()[0];
        this.pubkey = pubkey;
        this.prvkey = prvkey;
    }
    get keyid() { return this.pubkey.getFingerprint().substr(32).toUpperCase(); }
    get fingerprint() { return this.pubkey.getFingerprint(); }
    get name() { return openpgp.util.parseUserId(this.userid).name; }
    get email() { return openpgp.util.parseUserId(this.userid).email; }
}
exports.User = User;
//# sourceMappingURL=user.js.map
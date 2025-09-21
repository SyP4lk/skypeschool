"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = verifyPassword;
let bcryptCompare = null;
try {
    const b = require('bcrypt');
    bcryptCompare = (p, h) => b.compare(p, h);
}
catch { }
try {
    if (!bcryptCompare) {
        const bjs = require('bcryptjs');
        bcryptCompare = (p, h) => bjs.compare(p, h);
    }
}
catch { }
async function verifyPassword(plain, hash) {
    if (!hash)
        return false;
    try {
        if (hash.startsWith('$argon2')) {
            const argon2 = require('argon2');
            return await argon2.verify(hash, plain);
        }
        if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
            if (!bcryptCompare)
                return false;
            return await bcryptCompare(plain, hash);
        }
        return plain === hash;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=password.util.js.map
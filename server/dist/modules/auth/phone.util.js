"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePhone = normalizePhone;
exports.looksLikeEmail = looksLikeEmail;
exports.looksLikePhone = looksLikePhone;
function normalizePhone(raw) {
    if (!raw)
        return null;
    const digits = String(raw).replace(/\D+/g, '');
    if (digits.length < 10)
        return null;
    if (digits.length === 11 && digits.startsWith('8')) {
        return '+7' + digits.slice(1);
    }
    if (digits.length === 10) {
        return '+7' + digits;
    }
    return '+' + digits;
}
function looksLikeEmail(s) {
    return /.+@.+\..+/.test(s);
}
function looksLikePhone(s) {
    return /[\d()\s+\-]{7,}/.test(s) && !looksLikeEmail(s);
}
//# sourceMappingURL=phone.util.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_ORIGINS = exports.JWT_EXPIRES_IN = exports.JWT_SECRET = void 0;
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
exports.JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
exports.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
exports.ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
//# sourceMappingURL=env.js.map
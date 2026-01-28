"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma.service");
const register_controller_1 = require("./register.controller");
const extraControllers = [];
try {
    const m = require('./auth.controller');
    if (m?.AuthController)
        extraControllers.push(m.AuthController);
}
catch { }
try {
    const m = require('./login.controller');
    if (m?.LoginController)
        extraControllers.push(m.LoginController);
}
catch { }
try {
    const m = require('./me.controller');
    if (m?.MeController)
        extraControllers.push(m.MeController);
}
catch { }
const extraProviders = [];
try {
    const m = require('./auth.service');
    if (m?.AuthService)
        extraProviders.push(m.AuthService);
}
catch { }
try {
    const m = require('./jwt.strategy');
    if (m?.JwtStrategy)
        extraProviders.push(m.JwtStrategy);
}
catch { }
try {
    const m = require('./local.strategy');
    if (m?.LocalStrategy)
        extraProviders.push(m.LocalStrategy);
}
catch { }
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'dev-secret',
                signOptions: { expiresIn: '30d' },
            }),
        ],
        controllers: [...extraControllers, register_controller_1.RegisterController],
        providers: [prisma_service_1.PrismaService, ...extraProviders],
        exports: [jwt_1.JwtModule],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map
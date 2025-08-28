"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const cookieParser = require("cookie-parser");
const env_1 = require("./config/env");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: env_1.ALLOWED_ORIGINS.length ? env_1.ALLOWED_ORIGINS : true,
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Set-Cookie']
    });
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
bootstrap();
//# sourceMappingURL=main.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrialRequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
let TrialRequestsService = class TrialRequestsService {
    prisma;
    logger = new common_1.Logger('TrialRequests');
    constructor(prisma) {
        this.prisma = prisma;
    }
    emailEnabled() {
        return (process.env.ENABLE_EMAIL || '') === '1';
    }
    async accept(payload) {
        await this.prisma.trialRequest.create({
            data: {
                name: payload.name,
                contact: payload.phone || payload.email || null,
                subjectId: payload.subjectId || null,
                message: payload.message || null,
            },
        });
        if (!this.emailEnabled()) {
            this.logger.log('TRIAL_REQUEST (noop): ' +
                JSON.stringify({ ...payload, at: new Date().toISOString() }));
            return { ok: true, mode: 'noop' };
        }
        return { ok: true, mode: 'email' };
    }
    status() {
        return { ok: true, emailEnabled: this.emailEnabled() };
    }
};
exports.TrialRequestsService = TrialRequestsService;
exports.TrialRequestsService = TrialRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrialRequestsService);
//# sourceMappingURL=trial-requests.service.js.map
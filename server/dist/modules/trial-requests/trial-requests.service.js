"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrialRequestsService = void 0;
const common_1 = require("@nestjs/common");
let TrialRequestsService = class TrialRequestsService {
    logger = new common_1.Logger('TrialRequests');
    emailEnabled() {
        return (process.env.ENABLE_EMAIL || '') === '1';
    }
    async accept(payload) {
        if (!this.emailEnabled()) {
            this.logger.log('TRIAL_REQUEST (noop): ' + JSON.stringify({ ...payload, at: new Date().toISOString() }));
            return { ok: true, mode: 'noop' };
        }
        return { ok: true, mode: 'email' };
    }
    status() {
        return { emailEnabled: this.emailEnabled() };
    }
};
exports.TrialRequestsService = TrialRequestsService;
exports.TrialRequestsService = TrialRequestsService = __decorate([
    (0, common_1.Injectable)()
], TrialRequestsService);
//# sourceMappingURL=trial-requests.service.js.map
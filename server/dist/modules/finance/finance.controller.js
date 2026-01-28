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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const finance_service_1 = require("./finance.service");
let FinanceController = class FinanceController {
    service;
    constructor(service) {
        this.service = service;
    }
    getBalance(req) {
        const id = req.user?.id || req.user?.sub;
        return this.service.getBalance(id);
    }
    listMine(req, q) {
        const id = req.user?.id || req.user?.sub;
        return this.service.listUserTransactions(id, q);
    }
    async exportCsv(res, q) {
        const list = await this.service.ops(q);
        const rows = [
            ['kind', 'type', 'status', 'amount', 'user_login', 'user_name', 'createdAt'],
            ...list.items.map((i) => [
                i.kind, i.type, i.status, i.amount,
                i.actor?.login || '',
                [i.actor?.lastName, i.actor?.firstName].filter(Boolean).join(' '),
                new Date(i.createdAt).toISOString(),
            ]),
        ];
        const csv = rows.map(r => r.map(v => String(v).replace(/"/g, '""')).map(v => `"${v}"`).join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
        res.send(csv);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)('me/balance'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('me/transactions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "listMine", null);
__decorate([
    (0, common_1.Get)('admin/transactions-csv'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "exportCsv", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('finance'),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const roles_guard_1 = require("../common/roles.guard");
const finance_controller_1 = require("./finance.controller");
const users_controller_1 = require("./users.controller");
const students_controller_1 = require("./students.controller");
const trials_controller_1 = require("./trials.controller");
const support_controller_1 = require("./support.controller");
const overview_controller_1 = require("./overview.controller");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            users_controller_1.AdminUsersController,
            students_controller_1.AdminStudentsController,
            finance_controller_1.AdminFinanceController,
            trials_controller_1.AdminTrialsController,
            support_controller_1.AdminSupportController,
            overview_controller_1.AdminOverviewController,
        ],
        providers: [prisma_service_1.PrismaService, roles_guard_1.RolesGuard],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map
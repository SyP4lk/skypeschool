"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentMeController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const prisma_service_1 = require("../../prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function normalizeStatus(s) {
    const v = String(s || '').toUpperCase();
    if (v.includes('DONE') || v.includes('COMPLETE'))
        return 'DONE';
    if (v.includes('CANCEL'))
        return 'CANCELED';
    if (v.includes('PLAN'))
        return 'PLANNED';
    return v || 'PLANNED';
}
function loadFS() {
    try {
        const file = path.join(process.cwd(), 'public', 'settings.json');
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8') || '{}');
        }
    }
    catch { }
    return {};
}
let StudentMeController = class StudentMeController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async myLessons(req) {
        const studentId = req.user.sub;
        let rows = [];
        try {
            rows = await this.prisma.lesson.findMany({
                where: { studentId },
                orderBy: { startsAt: 'asc' },
                include: {
                    subject: true,
                    teacher: { select: { id: true, login: true, firstName: true, lastName: true } },
                },
            });
        }
        catch {
            rows = [];
        }
        return rows.map((r) => ({
            id: r.id,
            startsAt: r.startsAt,
            duration: r.duration ?? r.durationMin ?? null,
            durationMin: r.duration ?? r.durationMin ?? null,
            price: Number(r.price ?? 0),
            status: normalizeStatus(r.status),
            subjectName: r.subject?.name ?? null,
            teacher: r.teacher ? { id: r.teacher.id, login: r.teacher.login, firstName: r.teacher.firstName, lastName: r.teacher.lastName } : null,
        }));
    }
    async topupText() {
        const p = this.prisma;
        try {
            const row = (await p.setting?.findUnique?.({ where: { key: 'payment_instructions' } })) ||
                (await p.settings?.findUnique?.({ where: { key: 'payment_instructions' } })) ||
                (await p.systemSetting?.findUnique?.({ where: { key: 'payment_instructions' } }));
            if (row?.value != null)
                return { text: String(row.value) };
        }
        catch { }
        try {
            const row = await p.systemSetting?.findUnique?.({ where: { key: 'student_topup_text' } });
            if (row?.value != null)
                return { text: String(row.value) };
        }
        catch { }
        const fsObj = loadFS();
        return { text: String(fsObj.student_topup_text || '') };
    }
};
exports.StudentMeController = StudentMeController;
__decorate([
    (0, common_1.Get)('lessons'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentMeController.prototype, "myLessons", null);
__decorate([
    (0, common_1.Get)('topup-text'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StudentMeController.prototype, "topupText", null);
exports.StudentMeController = StudentMeController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('student'),
    (0, common_1.Controller)('student/me'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentMeController);
//# sourceMappingURL=student-me.controller.js.map
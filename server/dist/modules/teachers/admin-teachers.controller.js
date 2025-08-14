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
exports.AdminTeachersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer = require('multer');
const path_1 = require("path");
const fs = require("fs");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const teachers_service_1 = require("./teachers.service");
const create_teacher_dto_1 = require("./dto/create-teacher.dto");
const update_teacher_dto_1 = require("./dto/update-teacher.dto");
let AdminTeachersController = class AdminTeachersController {
    teachersService;
    constructor(teachersService) {
        this.teachersService = teachersService;
    }
    findAll() {
        return this.teachersService.findAllForAdmin();
    }
    findOne(id) {
        return this.teachersService.findOneDetail(id);
    }
    create(file, dto) {
        if (typeof dto.teacherSubjects === 'string') {
            try {
                dto.teacherSubjects = JSON.parse(dto.teacherSubjects);
            }
            catch (e) {
            }
        }
        if (file) {
            dto.photo = `/uploads/${file.filename}`;
        }
        return this.teachersService.createTeacher(dto);
    }
    update(id, file, dto) {
        if (dto && typeof dto.teacherSubjects === 'string') {
            try {
                dto.teacherSubjects = JSON.parse(dto.teacherSubjects);
            }
            catch (e) {
            }
        }
        if (file) {
            dto.photo = `/uploads/${file.filename}`;
        }
        return this.teachersService.updateTeacher(id, dto);
    }
    remove(id) {
        return this.teachersService.removeTeacher(id);
    }
};
exports.AdminTeachersController = AdminTeachersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminTeachersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminTeachersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', {
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = 'public/uploads';
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueName = `${Date.now()}-${file.originalname}`;
                cb(null, uniqueName);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowed = ['.jpg', '.jpeg', '.png'];
            const ext = (0, path_1.extname)(file.originalname).toLowerCase();
            if (allowed.includes(ext)) {
                cb(null, true);
            }
            else {
                cb(new Error('Unsupported file type'), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_teacher_dto_1.CreateTeacherDto]),
    __metadata("design:returntype", void 0)
], AdminTeachersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', {
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = 'public/uploads';
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueName = `${Date.now()}-${file.originalname}`;
                cb(null, uniqueName);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowed = ['.jpg', '.jpeg', '.png'];
            const ext = (0, path_1.extname)(file.originalname).toLowerCase();
            if (allowed.includes(ext)) {
                cb(null, true);
            }
            else {
                cb(new Error('Unsupported file type'), false);
            }
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_teacher_dto_1.UpdateTeacherDto]),
    __metadata("design:returntype", void 0)
], AdminTeachersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminTeachersController.prototype, "remove", null);
exports.AdminTeachersController = AdminTeachersController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Controller)('admin/teachers'),
    __metadata("design:paramtypes", [teachers_service_1.TeachersService])
], AdminTeachersController);
//# sourceMappingURL=admin-teachers.controller.js.map
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
exports.AdminArticlesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const path_1 = require("path");
const fs = require("fs");
const articles_service_1 = require("./articles.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const multer = require('multer');
function ensureDir(dir) {
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/uploads';
        try {
            ensureDir(dir);
            cb(null, dir);
        }
        catch (e) {
            cb(e, dir);
        }
    },
    filename: (req, file, cb) => {
        const ext = (0, path_1.extname)(file.originalname || '').toLowerCase();
        const base = (file.originalname || 'image').replace(/\.[^/.]+$/, '');
        const safe = base.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').slice(0, 50) || 'image';
        cb(null, `${Date.now()}-${safe}${ext}`);
    },
});
let AdminArticlesController = class AdminArticlesController {
    articles;
    constructor(articles) {
        this.articles = articles;
    }
    async getOne(id) {
        const a = await this.articles.findById(id);
        if (!a)
            throw new common_1.BadRequestException('not found');
        return a;
    }
    async create(file, title, content) {
        if (!title?.trim())
            throw new common_1.BadRequestException('title is required');
        if (!content?.trim())
            throw new common_1.BadRequestException('content is required');
        const image = file ? `/uploads/${file.filename}` : null;
        return this.articles.create({ title: title.trim(), content, image });
    }
    async update(id, file, title, content) {
        if (!title && !content && !file) {
            throw new common_1.BadRequestException('no changes provided');
        }
        const patch = {};
        if (typeof title === 'string') {
            if (!title.trim())
                throw new common_1.BadRequestException('title cannot be empty');
            patch.title = title.trim();
        }
        if (typeof content === 'string') {
            if (!content.trim())
                throw new common_1.BadRequestException('content cannot be empty');
            patch.content = content;
        }
        if (file)
            patch.image = `/uploads/${file.filename}`;
        return this.articles.update(id, patch);
    }
    async remove(id) {
        await this.articles.remove(id);
        return { ok: true };
    }
};
exports.AdminArticlesController = AdminArticlesController;
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminArticlesController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('title')),
    __param(2, (0, common_1.Body)('content')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminArticlesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('title')),
    __param(3, (0, common_1.Body)('content')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminArticlesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminArticlesController.prototype, "remove", null);
exports.AdminArticlesController = AdminArticlesController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Controller)('admin/articles'),
    __metadata("design:paramtypes", [articles_service_1.ArticlesService])
], AdminArticlesController);
//# sourceMappingURL=admin-articles.controller.js.map
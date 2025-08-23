"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./modules/auth/auth.module");
const categories_module_1 = require("./modules/categories/categories.module");
const subjects_module_1 = require("./modules/subjects/subjects.module");
const teachers_module_1 = require("./modules/teachers/teachers.module");
const admin_module_1 = require("./modules/admin/admin.module");
const students_module_1 = require("./modules/students/students.module");
const lessons_module_1 = require("./modules/lessons/lessons.module");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const trial_requests_module_1 = require("./modules/trial-requests/trial-requests.module");
const articles_module_1 = require("./modules/articles/articles.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'public'),
            }),
            auth_module_1.AuthModule, categories_module_1.CategoriesModule, subjects_module_1.SubjectsModule, teachers_module_1.TeachersModule, admin_module_1.AdminModule, students_module_1.StudentsModule, lessons_module_1.LessonsModule, trial_requests_module_1.TrialRequestsModule, articles_module_1.ArticlesModule
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
import { Body, Controller, Get, Param, Post, Put, Delete, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@Controller('teachers')
export class TeachersController {
  constructor(private prisma: PrismaService) {}

  @Get()
async list() {
  return this.prisma.teacherProfile.findMany({
    include: {
      user: { select: { id: true, login: true, firstName: true, lastName: true, balance: true } },
      teacherSubjects: { include: { subject: true } },
    },
  });
}


  @Get(':id')
  async one(@Param('id') id: string) {
    return this.prisma.teacherProfile.findUnique({
      where: { id },
      include: { user: true, teacherSubjects: { include: { subject: true } } },
    });
  }

  @Roles('admin')
  @Post()
  async create(@Body() body: { userId: string; aboutShort?: string; isActive?: boolean; sortOrder?: number }) {
    return this.prisma.teacherProfile.create({ data: body });
  }

  @Roles('admin')
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.prisma.teacherProfile.update({ where: { id }, data });
  }

  // link teacher to subject with price/duration
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/subjects')
  async addSubject(
    @Param('id') teacherId: string,
    @Body() body: { subjectId: string; price: number; duration: number },
  ) {
    return this.prisma.teacherSubject.create({ data: { teacherId, subjectId: body.subjectId, price: body.price, duration: body.duration } });
  }

  @Roles('admin')
  @Delete('subject-link/:linkId')
  async removeLink(@Param('linkId') linkId: string) {
    await this.prisma.teacherSubject.delete({ where: { id: linkId } });
    return { ok: true };
  }
}

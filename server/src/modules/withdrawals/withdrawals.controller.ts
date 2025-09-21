
import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { WithdrawalsService } from './withdrawals.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly service: WithdrawalsService) {}

  @Post('teacher/me')
  @Roles('teacher')
  async createMy(@Req() req: any, @Body() body: { amount: number; notes?: string }) {
    const teacherId = req.user.sub;
    return this.service.createTeacherRequest(teacherId, body.amount, body.notes || '');
  }

  @Get('teacher/me')
  @Roles('teacher')
  async myList(@Req() req: any, @Query('page') page = '1', @Query('limit') limit = '20') {
    const teacherId = req.user.sub;
    return this.service.listTeacherRequests(teacherId, Number(page) || 1, Number(limit) || 20);
  }
}

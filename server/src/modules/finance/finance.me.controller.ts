import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../common/roles.guard';
import { FinanceService } from './finance.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceMeController {
  constructor(private readonly service: FinanceService) {}

  @Get('me/balance')
  getBalance(@Req() req: any) {
    const id = req.user?.id || req.user?.sub;
    return this.service.getBalance(id);
  }

  @Get('me/transactions')
  listMine(@Req() req: any, @Query() q: any) {
    const id = req.user?.id || req.user?.sub;
    const svc: any = this.service as any;
    if (typeof svc.listUserTransactions === 'function') {
      return svc.listUserTransactions(id, q);
    }
    return { items: [], total: 0, page: Number(q?.page||1), limit: Number(q?.limit||20) };
  }
}

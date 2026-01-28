import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { FinanceService } from './finance.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('me/balance')
  getBalance(@Req() req: any) {
    const id = req.user?.id || req.user?.sub;
    return this.service.getBalance(id);
  }

  @Get('me/transactions')
  listMine(@Req() req: any, @Query() q: any) {
    const id = req.user?.id || req.user?.sub;
    return this.service.listUserTransactions(id, q);
  }

  // экспорт CSV (опционально)
  @Get('admin/transactions-csv')
  @Roles('admin')
  async exportCsv(@Res() res: Response, @Query() q: any) {
    const list = await this.service.ops(q);
    const rows = [
      ['kind','type','status','amount','user_login','user_name','createdAt'],
      ...list.items.map((i:any)=>[
        i.kind, i.type, i.status, i.amount,
        i.actor?.login || '',
        [i.actor?.lastName, i.actor?.firstName].filter(Boolean).join(' '),
        new Date(i.createdAt).toISOString(),
      ]),
    ];
    const csv = rows.map(r => r.map(v => String(v).replace(/"/g,'""')).map(v => `"${v}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  }
}

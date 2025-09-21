import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FinanceService } from './finance.service';
import { FinanceMeController } from './finance.me.controller';

const extraControllers: any[] = [];
try { const m = require('./finance.controller'); if (m?.FinanceController) extraControllers.push(m.FinanceController); } catch {}
try { const m = require('./admin.finance.controller'); if (m?.AdminFinanceController) extraControllers.push(m.AdminFinanceController); } catch {}
try { const m = require('./admin.withdrawals.controller'); if (m?.AdminWithdrawalsController) extraControllers.push(m.AdminWithdrawalsController); } catch {}
try { const m = require('./withdrawals.controller'); if (m?.TeacherWithdrawalsController) extraControllers.push(m.TeacherWithdrawalsController); } catch {}

@Module({
  controllers: [...extraControllers, FinanceMeController],
  providers: [PrismaService, FinanceService],
})
export class FinanceModule {}

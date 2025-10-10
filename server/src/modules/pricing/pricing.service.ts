import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Возвращает цены (в копейках) для пары teacherId+subjectId.
   * Фолбэк: берём teacherSubjects.price (в РУБЛЯХ!) и умножаем на 100 для teacherPrice,
   * publicPrice = teacherPrice.
   */
  async resolve(teacherId: string, subjectId?: string | null): Promise<{ teacherPrice: number; publicPrice: number } | null> {
    const tId = String(teacherId || '').trim();
    const sId = String(subjectId || '').trim();
    if (!tId) return null;

    // Пробуем явное правило в Pricing
    if (sId) {
      const p = await (this.prisma as any).pricing.findUnique({ where: { teacherId_subjectId: { teacherId: tId, subjectId: sId } } });
      if (p) return { teacherPrice: Number(p.teacherPrice || 0), publicPrice: Number(p.publicPrice || 0) };
    }

    // Фолбэк — берём текущие teacherSubjects
    if (sId) {
      const ts = await (this.prisma as any).teacherSubject.findFirst({ where: { teacherId: tId, subjectId: sId }, select: { price: true } });
      if (ts && Number(ts.price) > 0) {
        const teacherRub = Number(ts.price);
        const kop = Math.round(teacherRub * 100);
        return { teacherPrice: kop, publicPrice: kop };
      }
    }

    // Полный фолбэк — нет данных
    return null;
  }
}

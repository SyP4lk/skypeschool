import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.subject.findMany({
      orderBy: { name: 'asc' },
      include: { category: true }
    });
  }
}
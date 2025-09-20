
// Insert before lesson.create()
const priceMinor: number | null =
  Number.isFinite(Number(dto?.price)) ? Math.trunc(Number(dto.price)) : null;

let student: any = null;
try {
  student = await this.prisma.user.findUnique({
    where: { id: dto.studentId },
    select: { id: true, balance: true } as any,
  } as any);
} catch (e) {
  try {
    const sp = await this.prisma.studentProfile.findUnique({
      where: { userId: dto.studentId },
      select: { userId: true } as any,
    } as any);
    if (sp) student = { id: sp.userId, balance: (sp as any)?.balance };
  } catch {}
}
if (priceMinor != null) {
  const balance = typeof student?.balance === 'number' ? student.balance : 0;
  if (balance < priceMinor) {
    throw new BadRequestException({ message: 'insufficient_funds' });
  }
}

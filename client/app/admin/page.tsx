// app/admin/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';

type Overview = {
  metrics: {
    todayLessons: number;
    next7Lessons: number;
    negativeBalances: number;
  };
  recentStudents: {
    id: string;
    login: string;
    firstName?: string | null;
    lastName?: string | null;
    createdAt: string;
  }[];
  recentChanges: {
    id: string;
    delta: number;
    reason?: string | null;
    createdAt: string;
    user: { id: string; login: string; firstName?: string | null; lastName?: string | null };
  }[];
};

function fullName(u: { firstName?: string | null; lastName?: string | null; login?: string }) {
  const fn = [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
  return fn || u?.login || '—';
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default async function AdminPage() {
  const api = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const token = cookies().get('token')?.value;

  // 1) Проверяем, что это админ
  const meRes = await fetch(`${api}/auth/me`, {
    headers: token ? { Cookie: `token=${token}` } : {},
    cache: 'no-store',
  });
  if (!meRes.ok) redirect(`/login?callback=${encodeURIComponent('/admin')}`);
  const me = await meRes.json();
  if (me?.role !== 'admin') redirect('/');

  // 2) Грузим дашборд
  const res = await fetch(`${api}/admin/overview`, {
    headers: token ? { Cookie: `token=${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) {
    // Если ручка недоступна — покажем минимальную заглушку: важно не уходить в цикл логина
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Дашборд</h1>
        <p className="text-red-600">Не удалось загрузить данные админки.</p>
      </main>
    );
  }

  const d = (await res.json()) as Overview;

  // фильтруем «удалённых» пользователей из списка
  const recentStudents = (d?.recentStudents ?? []).filter(s => !String(s.login || '').includes('__deleted__'));
  const recentChanges = (d?.recentChanges ?? []).filter(ch => !String(ch?.user?.login || '').includes('__deleted__'));

  return (
    <main className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Дашборд</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm">
          <div className="text-sm text-gray-500">Уроков сегодня</div>
          <div className="mt-1 text-3xl font-semibold">{d?.metrics?.todayLessons ?? 0}</div>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm">
          <div className="text-sm text-gray-500">Ближайшие 7 дней</div>
          <div className="mt-1 text-3xl font-semibold">{d?.metrics?.next7Lessons ?? 0}</div>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm">
          <div className="text-sm text-gray-500">Отрицательные балансы</div>
          <div className="mt-1 text-3xl font-semibold">{d?.metrics?.negativeBalances ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Новые ученики</CardTitle>
          <ul className="divide-y">
            {recentStudents.length > 0 ? (
              recentStudents.map(s => (
                <li key={s.id} className="py-3 flex items-center justify-between">
                  <div className="font-medium">{fullName(s)}</div>
                  <div className="text-sm text-gray-500">{fmtDate(s.createdAt)}</div>
                </li>
              ))
            ) : (
              <li className="py-4 text-gray-500">Пока пусто</li>
            )}
          </ul>
        </Card>

        <Card>
          <CardTitle>Изменения балансов</CardTitle>
          <ul className="divide-y">
            {recentChanges.length > 0 ? (
              recentChanges.map(ch => (
                <li key={ch.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{fullName(ch.user)}</span>
                      <span className={`ml-2 ${ch.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {(ch.delta / 100).toFixed(2)} ₽
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{fmtDate(ch.createdAt)}</div>
                  </div>
                  {ch.reason ? <div className="text-sm text-gray-500 mt-1">{ch.reason}</div> : null}
                </li>
              ))
            ) : (
              <li className="py-4 text-gray-500">Пока пусто</li>
            )}
          </ul>
        </Card>
      </div>
    </main>
  );
}

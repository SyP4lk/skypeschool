'use client';

import { useEffect, useState } from 'react';
import { api } from './_lib/api';
import { Card, CardTitle } from '@/components/ui/Card';

type Overview = {
  metrics: { todayLessons: number; next7Lessons: number; negativeBalances: number };
  recentStudents: { id: string; login: string; firstName?: string | null; lastName?: string | null; createdAt: string }[];
  recentChanges: {
    id: string;
    delta: number;
    reason?: string | null;
    createdAt: string;
    user: { id: string; login: string; firstName?: string | null; lastName?: string | null };
  }[];
};

function FullName(u: { firstName?: string | null; lastName?: string | null; login?: string }) {
  const fn = [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
  return fn || u?.login || '—';
}

function Stat({ title, value, trend }: { title: string; value: string | number; trend?: 'up' | 'down' | null }) {
  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
      {trend && (
        <div className={`text-xs mt-1 ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend === 'up' ? '▲' : '▼'} тренд
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/admin/overview')
      .then((d: Overview) => {
        const recentStudents = (d?.recentStudents ?? []).filter(
          (s) => !String(s.login || '').includes('__deleted__')
        );
        const recentChanges = (d?.recentChanges ?? []).filter(
          (ch) => !String(ch?.user?.login || '').includes('__deleted__')
        );
        setData({ ...d, recentStudents, recentChanges });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Дашборд</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Уроков сегодня" value={data?.metrics.todayLessons ?? 0} />
        <Stat title="Ближайшие 7 дней" value={data?.metrics.next7Lessons ?? 0} />
        <Stat title="Отрицательные балансы" value={data?.metrics.negativeBalances ?? 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Новые ученики</CardTitle>
          <ul className="divide-y">
            {(data?.recentStudents ?? []).map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between">
                <div className="font-medium">{FullName(s)}</div>
                <div className="text-sm text-gray-500">{new Date(s.createdAt).toLocaleString()}</div>
              </li>
            ))}
            {(!data?.recentStudents || data.recentStudents.length === 0) && (
              <li className="py-4 text-gray-500">Пока пусто</li>
            )}
          </ul>
        </Card>

        <Card>
          <CardTitle>Изменения балансов</CardTitle>
          <ul className="divide-y">
            {(data?.recentChanges ?? []).map((ch) => (
              <li key={ch.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{FullName(ch.user)}</span>
                    <span className={`ml-2 ${ch.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {(ch.delta / 100).toFixed(2)} ₽
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">{new Date(ch.createdAt).toLocaleString()}</div>
                </div>
                {ch.reason ? <div className="text-sm text-gray-500 mt-1">{ch.reason}</div> : null}
              </li>
            ))}
            {(!data?.recentChanges || data.recentChanges.length === 0) && (
              <li className="py-4 text-gray-500">Пока пусто</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

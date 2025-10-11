'use client';

import React, { useEffect, useMemo, useState } from 'react';

type ProfitSubject = {
  subject: string;
  total: number;   // копейки
  count: number;
};

type ProfitResponse = {
  total: number;   // копейки
  lessons: number;
  avgFee: number;  // копейки
  bySubject?: ProfitSubject[];
  from?: string;
  to?: string;
  // допустим бэк может вернуть ещё поля — не критично
};

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatRub(cents: number) {
  const rub = (cents ?? 0) / 100;
  return rub.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 });
}

export default function ProfitCard() {
  // дефолт: последние 30 дней
  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState<string>(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return toYMD(d);
  });
  const [to, setTo] = useState<string>(() => toYMD(today));

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ProfitResponse | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/admin/finance/profit?` + params.toString(), {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`);
      }
      const json = (await res.json()) as ProfitResponse;
      setData(json);
    } catch (e: any) {
      setErr(e?.message || 'Не удалось получить данные');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // авто-загрузка на первый рендер
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full rounded-2xl border border-gray-200/60 bg-white/70 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Прибыль школы</h3>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="rounded-md border px-2 py-1"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            max={to || undefined}
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            className="rounded-md border px-2 py-1"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            min={from || undefined}
            max={toYMD(today)}
          />
          <button
            onClick={load}
            disabled={loading}
            className="rounded-md bg-black px-3 py-1 text-white disabled:opacity-50"
            title="Обновить"
          >
            {loading ? 'Загрузка…' : 'Показать'}
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 p-3">
          <div className="text-xs text-gray-500">Итого прибыль</div>
          <div className="text-2xl font-semibold">
            {formatRub(data?.total ?? 0)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 p-3">
          <div className="text-xs text-gray-500">Завершённых уроков</div>
          <div className="text-2xl font-semibold">{data?.lessons ?? 0}</div>
        </div>
        <div className="rounded-xl border border-gray-100 p-3">
          <div className="text-xs text-gray-500">Средняя комиссия</div>
          <div className="text-2xl font-semibold">{formatRub(data?.avgFee ?? 0)}</div>
        </div>
      </div>

      {!!(data?.bySubject?.length) && (
        <div className="mt-4">
          <div className="mb-2 text-sm font-medium text-gray-600">Топ предметов</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {data!.bySubject!.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
                <div className="truncate pr-2 text-sm">{s.subject}</div>
                <div className="text-sm text-gray-700">
                  {formatRub(s.total)} <span className="text-gray-400">· {s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        Диапазон: {from} — {to}
      </div>
    </div>
  );
}

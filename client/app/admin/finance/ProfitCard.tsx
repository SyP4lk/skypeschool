// PATCH: 2025-09-28
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function fmt(kopecks: number) {
  const rub = Number(kopecks || 0) / 100;
  return rub.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2 });
}

// Надёжная база API
// API base fixed to proxy
function getApiBase(){ return '/api'; }
  return 'http://localhost:3001/api';
}

export default function ProfitCard() {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const apiBase = useMemo(getApiBase, []);

  const presets = useMemo(
    () => [
      { label: '7 дней', range: 7 },
      { label: '30 дней', range: 30 },
      { label: 'Квартал', range: 90 },
    ],
    []
  );

  // Дебаунс запросов при ручном вводе дат
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function triggerLoadDebounced() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void load(); // fire and forget
    }, 300);
  }

  async function load() {
    // Валидируем перед запросом
    if (!from || !to) return;
    if (from > to) {
      setErr('Дата "от" больше даты "до"');
      setData(null);
      return;
    }

    setErr(undefined);
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set('from', from);
      qs.set('to', to);

      const url = `${apiBase}/admin/finance/profit?${qs.toString()}`;
      const res = await fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });

      // Попробуем распарсить JSON, даже если статус не 2xx
      let j: any = null;
      try {
        j = await res.json();
      } catch {
        /* ignore */
      }

      if (!res.ok) {
        const msg =
          (j && (j.message || j.error)) ||
          `Ошибка запроса (${res.status}${res.statusText ? ` ${res.statusText}` : ''})`;
        throw new Error(msg);
      }

      setData(j);
    } catch (e: any) {
      setData(null);
      setErr(e?.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  // Пресеты — выставляем даты, эффект ниже сам подхватит и сделает запрос
  function usePreset(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    const f = start.toISOString().slice(0, 10);
    const t = end.toISOString().slice(0, 10);
    setFrom(f);
    setTo(t);
  }

  // Автозапрос при изменении дат (с дебаунсом)
  useEffect(() => {
    if (from && to) triggerLoadDebounced();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  // При первом монтировании — пресет 7 дней
  useEffect(() => {
    if (!from && !to) usePreset(7);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="mb-4 p-3 rounded border">
      <div className="font-semibold mb-2">Сколько заработала школа</div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        {presets.map((p) => (
          <button
            key={p.range}
            type="button"
            className="px-2 py-1 rounded border"
            onClick={() => usePreset(p.range)}
            disabled={loading}
          >
            {p.label}
          </button>
        ))}

        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded border px-2 py-1"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded border px-2 py-1"
        />

        {/* Индикатор загрузки / ошибки — без alert */}
        {loading && <span className="text-sm opacity-70">Считаю…</span>}
        {err && !loading && <span className="text-red-600 text-sm">{String(err)}</span>}
      </div>

      {data && (
        <div className="text-sm">
          <div>
            <span className="opacity-70">Прибыль:</span> <b>{fmt(data.total)}</b>
          </div>
          <div className="flex flex-wrap gap-6 mt-1">
            <div>
              <span className="opacity-70">Уроков:</span> <b>{data.lessons}</b>
            </div>
            <div>
              <span className="opacity-70">Средняя комиссия:</span> <b>{fmt(data.avgFee)}</b>
            </div>
          </div>

          {Array.isArray(data.bySubject) && data.bySubject.length > 0 && (
            <div className="mt-2">
              <div className="opacity-70 mb-1">Топ-3 предмета по комиссии</div>
              <ul className="list-disc pl-5">
                {data.bySubject.map((s: any) => (
                  <li key={s.subjectId}>
                    {s.title} — <b>{fmt(s.fee)}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Пустой стейт — когда дат нет/ошибка/0 уроков */}
      {!loading && !data && !err && from && to && (
        <div className="text-sm opacity-70">Нет данных за выбранный период.</div>
      )}
    </section>
  );
}

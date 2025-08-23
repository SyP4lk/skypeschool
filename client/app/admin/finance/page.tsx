'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../_lib/api';
import Input from '@/components/ui/Input';
import { Card, CardTitle } from '@/components/ui/Card';

type UserLite = {
  id: string;
  login: string;
  firstName: string | null;
  lastName: string | null;
  role: 'student' | 'teacher' | 'admin';
  balance: number; // копейки
};

export default function FinancePage() {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<UserLite[]>([]);
  const [selected, setSelected] = useState<UserLite | null>(null);

  const [amount, setAmount] = useState(''); // ₽ в строке
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // поиск пользователя
  async function search() {
    setErr(null);
    try {
      const qs = new URLSearchParams({ query });
      const r = await api(`/admin/users?${qs.toString()}`);
      setFound(r.items || []);
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  // показать текущий баланс выбранного
  async function refreshBalance() {
    if (!selected) return;
    try {
      const r = await api(`/admin/users/${selected.id}/balance`);
      setSelected({ ...selected, balance: r.balance ?? selected.balance });
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    // авто-поиск при вводе запроса
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const kopecks = useMemo(() => {
    const s = amount.replace(',', '.').trim();
    if (!s) return NaN;
    const v = Number(s);
    if (!Number.isFinite(v)) return NaN;
    return Math.round(v * 100);
  }, [amount]);

  const canSubmit = !!selected && Number.isInteger(kopecks) && Math.abs(kopecks) > 0 && !busy;

  async function submit(sign: 1 | -1) {
    if (!selected) return;
    if (!canSubmit) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const body = {
        userId: selected.id,
        delta: sign * kopecks,
        reason: comment || undefined, // не обязателен
      };
      const r = await api('/admin/balance-change', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setMsg(
        `Баланс обновлён: ${(r.balance / 100).toFixed(2)} ₽ (Δ ${((sign * kopecks) / 100).toFixed(2)} ₽)`,
      );
      await refreshBalance();
      setAmount('');
      setComment('');
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardTitle>Финансы</CardTitle>

        {/* выбор пользователя */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1">Пользователь</label>
            <Input
              placeholder="Поиск по логину / ФИО"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && found.length > 0 && (
              <div className="mt-2 border rounded divide-y max-h-60 overflow-auto">
                {found.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    className="w-full text-left p-2 hover:bg-gray-50"
                    onClick={() => {
                      setSelected(u);
                      setFound([]);
                      setQuery(`${u.login} — ${[u.lastName, u.firstName].filter(Boolean).join(' ')}`);
                    }}
                  >
                    <div className="font-medium">{u.login}</div>
                    <div className="text-xs text-gray-600">
                      {[u.lastName, u.firstName].filter(Boolean).join(' ') || '—'} · {u.role} ·{' '}
                      {(u.balance / 100).toFixed(2)} ₽
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm block mb-1">Текущий баланс</label>
            <div className="p-2 border rounded bg-gray-50">
              {selected ? (selected.balance / 100).toFixed(2) + ' ₽' : '—'}
            </div>
          </div>
        </div>

        {/* сумма и действия */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm block mb-1">Сумма (₽)</label>
            <Input
              placeholder="например 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-1">
              Отправляем на сервер в копейках. Введи только число, без «₽».
            </div>
          </div>

          <div>
            <label className="text-sm block mb-1">
              Комментарий (необязательно)
            </label>
            <Input
              placeholder="Например: корректировка, бонус и т.д."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={!canSubmit}
            onClick={() => submit(1)}
          >
            + Пополнить
          </button>
          <button
            className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50"
            disabled={!canSubmit}
            onClick={() => submit(-1)}
          >
            – Убавить
          </button>

          {msg && <span className="text-green-700 text-sm">{msg}</span>}
          {err && <span className="text-red-600 text-sm">{err}</span>}
        </div>
      </Card>
    </div>
  );
}

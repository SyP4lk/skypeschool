'use client';
import { useEffect, useState } from 'react';
import { api } from '../_lib/api';

export default function BalanceCard() {
  const [balance, setBalance] = useState<number>(0);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api<{balance:number;currency:string}>('/finance/me/balance');
        setBalance(Number(r?.balance || 0));
      } catch (e:any) {
        setErr(e?.message || 'Ошибка');
      }
    })();
  }, []);

  const fmt = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(balance || 0));

  return (
    <div className="rounded-xl border p-4">
      <div className="font-semibold mb-2">Баланс</div>
      <div className="text-2xl">{fmt}</div>
      {err && <div className="text-red-600 text-sm mt-2">{err}</div>}
    </div>
  );
}

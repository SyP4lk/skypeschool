'use client';
import { useEffect, useMemo, useState } from 'react';
import ProfitCard from './ProfitCard';

type User = {
  id: string;
  login: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  role: 'admin'|'teacher'|'student';
  balance?: number;
};

type Op = {
  id: string;
  kind: 'manual'|'withdraw'; // lesson removed for now
  type: 'DEPOSIT'|'WITHDRAW'|'WITHDRAW_DONE'|'WITHDRAW_CANCELED';
  status: 'PENDING'|'DONE'|'CANCELED';
  amount: number;
  createdAt: string;
  actor: User;
  counterpart?: User;
  meta?: any;
};

const API_BASE = '';
async function api<T=any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  const txt = await res.text().catch(()=> '');
  let data: any = null;
  try { data = txt ? JSON.parse(txt) : null; } catch {}
  if (!res.ok) {
    throw new Error((data && (data.message || data.error)) || txt || `HTTP ${res.status}`);
  }
  return data ?? ({} as any);
}

function fmtRubKop(kopecks: number) {
  const rub = (Number(kopecks||0)/100);
  return rub.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2 });
}

function fullName(u?: User) {
  if (!u) return '';
  const name = [u.lastName, u.firstName].filter(Boolean).join(' ');
  return name || u.login;
}

function typeRu(t: Op['type']) {
  switch (t) {
    case 'DEPOSIT': return 'Пополнение';
    case 'WITHDRAW': return 'Списание';
    case 'WITHDRAW_DONE': return 'Выплата';
    case 'WITHDRAW_CANCELED': return 'Отмена заявки';
    default: return t;
  }
}
function statusRu(s: Op['status']) {
  switch (s) {
    case 'PENDING': return 'Ожидает';
    case 'DONE': return 'Выполнено';
    case 'CANCELED': return 'Отменено';
    default: return s;
  }
}
function statusCls(s: Op['status']) {
  switch (s) {
    case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'DONE': return 'bg-green-100 text-green-800 border-green-300';
    case 'CANCELED': return 'bg-rose-100 text-rose-800 border-rose-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}
function typeCls(t: Op['type']) {
  switch (t) {
    case 'DEPOSIT': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'WITHDRAW': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'WITHDRAW_DONE': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'WITHDRAW_CANCELED': return 'bg-gray-100 text-gray-800 border-gray-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export default function AdminFinancePage() {
  // ручная корректировка
  const [userQ, setUserQ] = useState('');
  const [userList, setUserList] = useState<User[]>([]);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [err, setErr] = useState<string|null>(null);
  const [msg, setMsg] = useState<string|null>(null);

  useEffect(() => {
    const val = userQ.trim();
    if (val.length < 2) { setUserList([]); return; }
    const ctrl = new AbortController();
    api<User[]>(`/admin/finance/users?q=${encodeURIComponent(val)}`, { signal: ctrl.signal as any })
      .then(setUserList).catch(()=>{});
    return () => ctrl.abort();
  }, [userQ]);

  async function adjust(sign: 1|-1) {
    setErr(null); setMsg(null);
    try {
      if (!targetUser?.id) throw new Error('Выберите пользователя');
      const rub = parseFloat((amount||'0').replace(',', '.'));
      if (!rub || rub<=0) throw new Error('Некорректная сумма');
      await api(`/admin/finance/adjust`, {
        method: 'POST',
        body: JSON.stringify({ userId: targetUser.id, amount: rub * sign, comment }),
      });
      setMsg('Сохранено');
      setAmount(''); setComment(''); setTargetUser(null); setUserQ('');
      await loadOps();
    } catch (e: any) {
      setErr(e?.message || 'Не удалось выполнить операцию');
    }
  }

  // реквизиты
  const [instr, setInstr] = useState('');
  const [loadingInstr, setLoadingInstr] = useState(false);

  useEffect(()=>{
    let stop = false;
    (async () => {
      setLoadingInstr(true);
      try {
        const data = await api<{ key: string; value: string }>(`/admin/settings?key=payment_instructions`);
        if (!stop) setInstr(data?.value || '');
      } catch {}
      setLoadingInstr(false);
    })();
    return () => { stop = true; };
  }, []);

  async function saveInstr() {
    setErr(null); setMsg(null);
    try {
      await api(`/admin/settings`, {
        method: 'PUT',
        body: JSON.stringify({ key: 'payment_instructions', value: instr }),
      });
      setMsg('Реквизиты сохранены');
    } catch (e:any) {
      setErr(e?.message || 'Ошибка сохранения реквизитов');
    }
  }

  // журнал
  const [q, setQ] = useState('');
  const [type, setType] = useState(''); // LESSON removed
  const [status, setStatus] = useState('');
  const [ops, setOps] = useState<Op[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const loadOps = async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    try {
      const data = await api<{ items: Op[]; total: number; page: number; limit: number }>(`/admin/finance/ops?${params.toString()}`);
      setOps(data.items || []);
      setTotal(data.total || 0);
    } catch (e:any) {
      setErr(e?.message || 'Ошибка загрузки журнала');
    }
  };

  useEffect(()=>{ loadOps(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q, type, status, page]);

  async function completeWithdraw(id: string) {
    try { await api(`/admin/finance/withdrawals/${id}/complete`, { method: 'POST' }); await loadOps(); }
    catch (e:any) { setErr(e?.message || 'Не удалось выполнить выплату'); }
  }
  async function cancelWithdraw(id: string) {
    try { await api(`/admin/finance/withdrawals/${id}/cancel`, { method: 'POST' }); await loadOps(); }
    catch (e:any) { setErr(e?.message || 'Не удалось отменить заявку'); }
  }

  const totalPages = Math.max(1, Math.ceil(total/limit));

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      {(err || msg) && (
        <div className="space-y-2">
          {err && <div className="px-3 py-2 rounded border border-rose-300 bg-rose-50 text-rose-800">{err}</div>}
          {msg && <div className="px-3 py-2 rounded border border-green-300 bg-green-50 text-green-800">{msg}</div>}
        </div>
      )}

      {/* Ручная корректировка */}
      <section className="rounded-xl border p-4 space-y-3">
        <div className="font-semibold">Пополнение / Списание</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm block mb-1">Пользователь</label>
            <div className="relative">
              <input className="w-full rounded border px-3 py-2" value={userQ} onChange={e=>{ setUserQ(e.target.value); setTargetUser(null); }} placeholder="Логин / ФИО / телефон / email" />
              {userList.length>0 && (
                <div className="absolute z-10 bg-white border rounded mt-1 w-full max-h-56 overflow-auto">
                  {userList.map(u => (
                    <div key={u.id} className={"px-3 py-2 hover:bg-gray-100 cursor-pointer"} onClick={()=>{ setTargetUser(u); setUserQ(fullName(u)); setUserList([]); }}>
                      <div className="font-medium">{u.login} — {fullName(u)}</div>
                      <div className="text-xs text-gray-500">{[u.phone, u.email].filter(Boolean).join(' · ')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm block mb-1">Сумма (₽)</label>
            <input className="w-full rounded border px-3 py-2" value={amount} onChange={e=>setAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-sm block mb-1">Комментарий</label>
            <input className="w-full rounded border px-3 py-2" value={comment} onChange={e=>setComment(e.target.value)} placeholder="необязательно" />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button className="px-4 py-2 rounded border bg-green-600 text-white" onClick={()=>adjust(1)}>+ Пополнить</button>
            <button className="px-4 py-2 rounded border bg-rose-600 text-white" onClick={()=>adjust(-1)}>- Списать</button>
            {targetUser && <div className="ml-auto text-sm text-gray-600">Баланс: <span className="font-semibold">{fmtRubKop(targetUser.balance || 0)}</span></div>}
          </div>
        </div>
      </section>

      {/* Реквизиты */}
      <section className="rounded-xl border p-4 space-y-3">
        <div className="font-semibold">Реквизиты для оплаты</div>
        <textarea className="w-full rounded border px-3 py-2 min-h-28" value={instr} onChange={e=>setInstr(e.target.value)} placeholder="Текст с инструкцией по пополнению" />
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded border bg-blue-600 text-white" onClick={saveInstr} disabled={loadingInstr}>Сохранить</button>
        </div>
      </section>

      {/* Журнал операций */}
      <section className="rounded-xl border p-4 space-y-3">
        <div className="font-semibold">Журнал операций</div>
        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <input className="w-full rounded border px-3 py-2" placeholder="Поиск (логин / ФИО / телефон / email)" value={q} onChange={e=>{ setPage(1); setQ(e.target.value); }} />
          </div>
          <div>
            <select className="w-full rounded border px-3 py-2" value={type} onChange={e=>{ setPage(1); setType(e.target.value); }}>
              <option value="">Тип: любой</option>
              <option value="MANUAL">Ручные</option>
              <option value="WITHDRAW">Выводы</option>
            </select>
          </div>
          <div>
            <select className="w-full rounded border px-3 py-2" value={status} onChange={e=>{ setPage(1); setStatus(e.target.value); }}>
              <option value="">Статус: любой</option>
              <option value="PENDING">Ожидает</option>
              <option value="DONE">Выполнено</option>
              <option value="CANCELED">Отменено</option>
            </select>
          </div>
        </div>

        {ops.length === 0 ? (
          <div className="text-sm text-gray-500">Записей не найдено</div>
        ) : (
          <div className="divide-y">
            {ops.map(op => (
              <div key={op.id} className="py-3 flex items-center gap-3">
                <div className={"text-xs px-2 py-1 rounded-full border " + typeCls(op.type)}>{typeRu(op.type)}</div>
                <div className={"text-xs px-2 py-1 rounded-full border " + statusCls(op.status)}>{statusRu(op.status)}</div>
                <div className="ml-auto font-semibold">{fmtRubKop(op.amount)}</div>
                <div className="w-[24%] text-sm text-gray-600 truncate">{fullName(op.actor)}</div>
                {op.kind==='withdraw' && op.status==='PENDING' && (
                  <div className="flex gap-2">
                    <button className="px-3 py-2 rounded border" onClick={()=>completeWithdraw(op.id)}>Выполнить</button>
                    <button className="px-3 py-2 rounded border" onClick={()=>cancelWithdraw(op.id)}>Отменить</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button className="px-3 py-2 rounded border" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Назад</button>
          <div className="text-sm text-gray-600">Стр. {page} из {Math.max(1, Math.ceil(total/limit))}</div>
          <button className="px-3 py-2 rounded border" disabled={page>=Math.max(1, Math.ceil(total/limit))} onClick={()=>setPage(p=>p+1)}>Вперёд</button>
          <div className="ml-auto text-xs text-gray-500">Показано: {ops.length} / {total}</div>
        </div>
      </section>
      <ProfitCard/>
  </div>
  );
}


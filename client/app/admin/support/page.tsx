// PATCH: 2025-09-29 — мгновенные обновления (без after), дедуп по id
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { api } from '../_lib/api';

type Status = 'new' | 'open' | 'closed' | 'all';
type Role = 'user' | 'admin';

type ThreadListItem = {
  id: string;
  firstAt?: string | null;
  lastAt?: string | null;
  count?: number;
  fromLogin?: string | null;
  contact?: string | null;
  // доп. поля — превью последнего сообщения
  preview?: string;
  previewRole?: Role;
};

type Message = {
  id: string;
  role: Role;
  message: string;
  createdAt: string; // ISO
};

const THREADS_REFRESH_MS = 30_000;
const MESSAGES_REFRESH_MS = 5_000;

function dt(s?: string | null) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('ru-RU');
  } catch {
    return s;
  }
}

export default function AdminSupportPage() {
  // Левый список
  const [status, setStatus] = useState<Status>('new');
  const [query, setQuery] = useState('');
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsErr, setThreadsErr] = useState<string | null>(null);

  // Правый чат
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sendText, setSendText] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  // Загрузка списка тредов
  const loadThreads = useCallback(async () => {
    setThreadsErr(null);
    setThreadsLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status !== 'all') qs.set('status', status);
      if (query.trim()) qs.set('query', query.trim());
      const res = await api(`/admin/support/threads${qs.toString() ? `?${qs}` : ''}`);

      const items: ThreadListItem[] = Array.isArray(res?.items)
        ? res.items.map((r: any) => ({
            id: String(r.id),
            firstAt: r.firstAt || null,
            lastAt: r.lastAt || null,
            count: Number(r.count || 0),
            fromLogin: r.fromLogin ?? null,
            contact: r.contact ?? null,
          }))
        : [];

      setThreads(items);

      // лениво подгружаем превью последнего
      items.slice(0, 30).forEach(async (t) => {
        try {
          const m = await api(`/admin/support/threads/${t.id}/messages`);
          const arr: Message[] = Array.isArray(m?.items) ? m.items : [];
          const last = arr[arr.length - 1];
          setThreads((prev) =>
            prev.map((x) =>
              x.id === t.id
                ? { ...x, preview: last?.message || '', previewRole: last?.role || 'user' }
                : x
            )
          );
        } catch {}
      });

      if (!activeId && items.length) setActiveId(items[0].id);
    } catch (e: any) {
      setThreadsErr(e?.message || 'Не удалось загрузить список диалогов');
    } finally {
      setThreadsLoading(false);
    }
  }, [status, query, activeId]);

  // Загрузка сообщений выбранного треда (без after) + дедуп по id
  const loadMessages = useCallback(
    async (initial = false) => {
      if (!activeId) return;
      setMsgLoading(initial);
      try {
        const res = await api(`/admin/support/threads/${activeId}/messages`);
        const add: Message[] = Array.isArray(res?.items) ? res.items : [];
        if (!add.length) {
          if (initial) setMessages([]);
          return;
        }

        setMessages((prev) => {
          if (initial) return add;
          const seen = new Set(prev.map((m) => m.id));
          const filtered = add.filter((m) => !seen.has(m.id));
          return filtered.length ? [...prev, ...filtered] : prev;
        });

        setTimeout(
          () => scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
          50
        );
      } catch {
        // тихо
      } finally {
        setMsgLoading(false);
      }
    },
    [activeId]
  );

  // Инициализация / обновление списка
  useEffect(() => {
    void loadThreads();
    const t = setInterval(() => void loadThreads(), THREADS_REFRESH_MS);
    return () => clearInterval(t);
  }, [loadThreads]);

  // Смена активного треда — полная загрузка ленты + опрос
  useEffect(() => {
    if (!activeId) return;
    setMessages([]);
    void loadMessages(true);
    const t = setInterval(() => void loadMessages(false), MESSAGES_REFRESH_MS);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  // Отправка сообщения (оптимистично + полный рефетч)
  const send = useCallback(async () => {
    if (!activeId || !sendText.trim() || sendLoading) return;
    setSendLoading(true);
    setSendErr(null);

    const text = sendText.trim();
    const optimistic: Message = {
      id: 'tmp-' + Math.random().toString(36).slice(2),
      role: 'admin',
      message: text,
      createdAt: new Date().toISOString(),
    };

    // мгновенно показать в правой колонке
    setMessages((prev) => [...prev, optimistic]);

    // обновить превью и время у выбранного треда в левой колонке
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, preview: text, previewRole: 'admin', lastAt: optimistic.createdAt } : t
      )
    );

    setSendText('');

    try {
      await api(`/admin/support/threads/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      // полный refetch ленты
      await loadMessages(true);
    } catch (e: any) {
      // откат оптимистичного сообщения
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setSendErr(e?.message || 'Не удалось отправить сообщение');
    } finally {
      setSendLoading(false);
    }
  }, [activeId, sendText, sendLoading, loadMessages]);

  // Поиск/фильтрация в левой колонке
  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => [t.id, t.preview, t.fromLogin, t.contact]
      .some((v) => String(v || '').toLowerCase().includes(q)));
  }, [threads, query]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardTitle>Поддержка</CardTitle>

        {/* Панель управления */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            <option value="new">Новые</option>
            <option value="open">Открытые</option>
            <option value="closed">Закрытые</option>
            <option value="all">Все</option>
          </Select>

          <Input placeholder="Поиск (имя/контакт/текст/id)" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="px-3 py-2 rounded bg-black text-white" onClick={() => void loadThreads()} type="button">
            Обновить
          </button>

          {threadsLoading && <span className="text-sm text-gray-500">Загрузка…</span>}
          {threadsErr && <span className="text-sm text-red-600">{threadsErr}</span>}
        </div>

        {/* Две колонки: список тредов и чат */}
        {/* Две колонки: список тредов и чат */}
<div className="grid" style={{ gridTemplateColumns: '280px 1fr', gap: '16px' }}>
  {/* Левая колонка — список диалогов */}
  <div className="border rounded-lg overflow-hidden h-[70vh]">
    <div className="px-3 py-2 text-sm text-gray-500 border-b">Сообщения поддержки</div>
    {/* фиксированная высота + скролл */}
    <div className="h-[calc(70vh-36px)] overflow-y-auto">
      {filteredThreads.map((t) => {
        const name = t.fromLogin?.trim();
        const contact = t.contact?.trim();
        const hasMeta = Boolean(name || contact);
        const title = hasMeta ? `${name || 'Без имени'}${contact ? ` • ${contact}` : ''}` : null;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveId(t.id)}
            className={`block w-full text-left px-3 py-3 border-b hover:bg-gray-50 ${
              activeId === t.id ? 'bg-gray-50' : ''
            }`}
          >
            <div className="text-sm font-medium">{title ?? <>Диалог #{t.id.slice(0, 8)}</>}</div>
            <div className="text-xs text-gray-500">{dt(t.lastAt)}</div>

            {t.preview && (
              <div className="mt-1 text-sm line-clamp-2">
                {t.previewRole === 'admin' ? 'Вы: ' : ''}
                {t.preview}
              </div>
            )}
          </button>
        );
      })}

      {filteredThreads.length === 0 && (
        <div className="px-3 py-6 text-sm text-gray-500">Диалоги не найдены</div>
      )}
    </div>
  </div>

  {/* Правая колонка — чат */}
  <div className="border rounded-lg flex flex-col h-[70vh]">
    {!activeId ? (
      <div className="p-6 text-gray-500">Выберите диалог слева</div>
    ) : (
      <>
        {/* фиксированная шапка */}
        <div className="px-4 py-2 border-b text-sm text-gray-500">
          Диалог #{activeId.slice(0, 8)} • {messages.length} сообщений
        </div>

        {/* прокручиваемая лента */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {msgLoading && messages.length === 0 && (
            <div className="text-sm text-gray-500">Загрузка…</div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={m.role === 'admin' ? 'text-right' : 'text-left'}>
              <div
                className="inline-block px-3 py-2 rounded-2xl max-w-[72%]"
                style={
                  m.role === 'admin'
                    ? { backgroundColor: '#e7f0ff', color: '#1e3a8a' }
                    : { backgroundColor: '#f1f3f5', color: '#111827' }
                }
              >
                <div className="whitespace-pre-wrap break-words">{m.message}</div>
                <div className="text-[10px] opacity-60 mt-1">{dt(m.createdAt)}</div>
              </div>
            </div>
          ))}
          <div ref={scrollAnchorRef} />
        </div>

        {/* фиксированный футер */}
        <div className="px-4 py-3 border-t bg-white">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="Ваш ответ…"
              value={sendText}
              onChange={(e) => setSendText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!sendText.trim() || sendLoading}
              className="px-3 py-2 rounded text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--colour-primary)' }}
            >
              Отправить
            </button>
          </div>
          {sendErr && <div className="text-xs text-red-600 mt-1">{sendErr}</div>}
        </div>
      </>
    )}
  </div>
</div>

      </Card>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useToast } from './Toast';

const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

type Lesson = { id: string; startsAt: string; subjectName?: string|null };

export default function StudentCancelInline() {
  const toast = useToast();
  const [items, setItems] = useState<Lesson[]>([]);

  async function load() {
    try {
      const r = await fetch(`${API}/student/me/lessons?status=scheduled`, { credentials: 'include' });
      const j = await r.json();
      const arr = Array.isArray(j?.items) ? j.items : (Array.isArray(j) ? j : []);
      setItems(arr);
    } catch {}
  }
  useEffect(() => { load(); }, []);

  async function cancel(id: string, startsAt: string) {
    const diffHrs = (new Date(startsAt).getTime() - Date.now()) / 3_600_000;
    if (diffHrs < 8) { toast({ type:'error', message:'Отменять можно не позднее чем за 8 часов до начала.'}); return; }
    const res = await fetch(`${API}/student/me/lessons/${id}/cancel`, { method:'POST', credentials:'include' });
    if (res.ok) { toast({ type:'success', message:'Урок отменён.'}); load(); }
    else {
      try { const j = await res.json(); if (j?.message==='too_late_to_cancel') toast({ type:'error', message:'Слишком поздно для отмены урока.'}); else toast({ type:'error', message:'Не удалось отменить урок.'}); } catch { toast({ type:'error', message:'Не удалось отменить урок.'}); }
    }
  }

  if (!items.length) return null;
  return (
    <div className="mt-4">
      <div className="text-sm text-gray-500 mb-2">Вы можете отменить ближайшие уроки:</div>
      <div className="space-y-2">
        {items.map(l => (
          <div key={l.id} className="rounded border px-3 py-2 flex items-center justify-between">
            <div className="text-sm">{l.subjectName || 'Урок'} · {new Date(l.startsAt).toLocaleString()}</div>
            <button className="text-red-600" onClick={() => cancel(l.id, l.startsAt)}>Отменить</button>
          </div>
        ))}
      </div>
    </div>
  );
}

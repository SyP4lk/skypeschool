
'use client';
import { useEffect, useState } from 'react';
import Greeting from '@/shared/ui/Greeting';
import { useToast } from '@/shared/ui/Toast';

const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

type Me = { id: string; firstName?: string|null; login?: string|null };

export default function TeacherLK() {
  const toast = useToast();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then(r => r.json()).then(setMe).catch(() => {});
  }, []);

  async function createLesson(payload: any) {
    const body = new URLSearchParams();
    Object.entries(payload || {}).forEach(([k, v]) => v != null && body.append(k, String(v)));
    const r = await fetch(`${API}/teacher/me/lessons`, { method: 'POST', body, credentials: 'include' });
    if (r.ok) {
      toast({ type: 'success', message: 'Урок назначен.' });
    } else {
      let msg = 'Не удалось назначить урок.';
      try { const j = await r.json(); if (j?.message === 'insufficient_funds') msg = 'У ученика недостаточно средств.'; } catch {}
      toast({ type: 'error', message: msg });
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Greeting firstName={me?.firstName} login={me?.login} />
      {/* Вызовите createLesson({ studentId, startsAt, priceMinor }) из вашей формы */}
    </div>
  );
}

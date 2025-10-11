const API = '/api';
// PATCH: 2025-09-28

'use client';
import { useEffect, useRef, useState } from 'react';

export default function ThreadPanel({ threadId }: { threadId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const lastTsRef = useRef<string | null>(null);

  async function load(initial = false) {
    const qs = new URLSearchParams();
    if (!initial && lastTsRef.current) qs.set('after', lastTsRef.current);
    const res = await fetch(`${API}/admin/support/threads/${threadId}/messages?${qs}`, { credentials:'include', cache:'no-store' });
    const j = await res.json();
    if (Array.isArray(j?.items)) {
      if (j.items.length) lastTsRef.current = j.items[j.items.length-1].createdAt;
      setItems(prev => initial ? j.items : [...prev, ...j.items]);
    }
  }

  useEffect(()=>{ load(true); const t = setInterval(()=>load(false), 7000); return ()=>clearInterval(t); }, [threadId]);

  async function send() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/support/threads/${threadId}/messages`, {
        method:'POST', credentials:'include', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(await res.text());
      setText('');
      await load(true);
    } finally { setLoading(false); }
  }

  return (
    <div className="border rounded p-2">
      <div className="h-64 overflow-auto text-sm space-y-2">
        {items.map(m=>(
          <div key={m.id} className={m.role==='admin' ? 'text-right' : ''}>
            <span className="inline-block px-2 py-1 rounded border">{m.message}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input className="border px-2 py-1 flex-1" value={text} onChange={e=>setText(e.target.value)} placeholder="Ответить..." />
        <button onClick={send} disabled={loading} className="border rounded px-3 py-1">{loading?'...':'Отправить'}</button>
      </div>
    </div>
  );
}


'use client';
import { useEffect, useState } from 'react';

const API = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

export default function HelloInline({ className='' }: { className?: string }) {
  const [name, setName] = useState<string | null>(null);
  const [login, setLogin] = useState<string | null>(null);
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((u) => { if (u) { setName(u.firstName || null); setLogin(u.login || null); } })
      .catch(() => {});
  }, []);
  const text = name ? `Здравствуйте, ${name}!` : `Здравствуйте${login ? `, ${login}` : ''}!`;
  return <span className={className}>{text}</span>;
}

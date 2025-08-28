'use client';

import { useState } from 'react';
import TrialRequestModal from '../../components/TrialRequestModal';

type TeacherSubject = { id?: string; subjectId?: string; name: string; price?: number | null; duration?: number | null };
type TeacherProfileDTO = {
  id: string;
  photo?: string | null;
  aboutShort?: string | null;
  user?: { firstName?: string | null; lastName?: string | null; login?: string | null } | null;
  teacherSubjects?: TeacherSubject[] | null;
};

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const ORIGIN = API.replace(/\/api$/, '');
const toAbs = (p?: string | null) => (!p ? null : p.startsWith('http') ? p : `${ORIGIN}${p.startsWith('/') ? '' : '/'}${p}`);

function fullName(t: TeacherProfileDTO) {
  const fn = t.user?.firstName?.trim() ?? '';
  const ln = t.user?.lastName?.trim() ?? '';
  const login = t.user?.login?.trim() ?? '';
  if (fn || ln) return `${fn} ${ln}`.trim();
  return login || 'Преподаватель';
}

export default function TeachersClient({ data }: { data: TeacherProfileDTO[] }) {
  const [trialOpen, setTrialOpen] = useState(false);

  return (
    <div className="container py-8">
      {data.length === 0 ? (
        <div className="text-gray-500">Не нашли преподавателей по заданным фильтрам</div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((t) => {
            const name = fullName(t);
            const about = t.aboutShort?.trim();
            const subs = t.teacherSubjects ?? [];
            const photoUrl = toAbs(t.photo);

            return (
              <li key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-100">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={name}
                        className="h-16 w-16 object-cover"
                        width={64}
                        height={64}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="grid h-16 w-16 place-items-center text-slate-400">👩‍🏫</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="mb-1 text-lg font-semibold">{name}</div>

                    {about && <p className="mb-2 line-clamp-2 text-sm text-slate-600">{about}</p>}

                    {subs.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {subs.map((s) => (
                          <span key={(s.id ?? s.name)} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <a href={`/teacher/${t.id}`} className="rounded bg-black px-3 py-1.5 text-sm text-white hover:opacity-90">
                        Страница преподавателя
                      </a>
                      <button
                        className="rounded border border-black px-3 py-1.5 text-sm hover:bg-black hover:text-white"
                        onClick={() => setTrialOpen(true)}
                      >
                        Бесплатный урок
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <TrialRequestModal open={trialOpen} onClose={() => setTrialOpen(false)} />
    </div>
  );
}

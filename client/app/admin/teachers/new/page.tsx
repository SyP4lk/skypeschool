'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Subject = { id: string; name: string };

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, ''); // напр. https://skypeschool-server.onrender.com/api

export default function AdminTeacherNewPage() {
  const router = useRouter();

  // Поля формы
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [aboutShort, setAboutShort] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Предметы
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<
    { subjectId: string; duration: number; price: number }[]
  >([{ subjectId: '', duration: 60, price: 0 }]);

  const [error, setError] = useState<string>('');

  // Загружаем справочник предметов
  useEffect(() => {
    const url = API_BASE ? `${API_BASE}/subjects` : `/api/subjects`;
    fetch(url, { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data) => {
        // ожидаем [{id, name}]
        setSubjectsList(Array.isArray(data) ? data : []);
      })
      .catch(() => setSubjectsList([]));
  }, []);

  // Сабмит формы
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    try {
      const formData = new FormData();
      formData.append('login', login);
      formData.append('password', password);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      if (aboutShort) formData.append('aboutShort', aboutShort);

      // имя поля для файла на бэке — 'photo'
      if (photoFile) formData.append('photo', photoFile);

      // список предметов — в JSON
      formData.append('teacherSubjects', JSON.stringify(teacherSubjects));

      const url = API_BASE
        ? `${API_BASE}/admin/teachers`
        : `/api/admin/teachers`;

      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        router.push('/admin/teachers');
      } else {
        const text = await res.text();
        setError(text || 'Ошибка при создании преподавателя');
      }
    } catch (err: any) {
      setError(err?.message || 'Не удалось отправить форму');
    }
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Новый преподаватель</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Логин</label>
          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="border p-2 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Имя</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border p-2 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Фамилия</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border p-2 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Фото</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setPhotoFile(file);
              if (file) {
                const reader = new FileReader();
                reader.onload = () => setPhotoPreview(reader.result as string);
                reader.readAsDataURL(file);
              } else {
                setPhotoPreview(null);
              }
            }}
            className="border p-2 w-full"
          />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              className="mt-2 max-h-40 object-contain border"
            />
          )}
        </div>

        <div>
          <label className="block mb-1">Краткое описание</label>
          <textarea
            value={aboutShort}
            onChange={(e) => setAboutShort(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Предметы, длительность и цена</label>

          {teacherSubjects.map((ts, idx) => (
            <div key={idx} className="mb-2 flex items-end space-x-2">
              <select
                value={ts.subjectId}
                onChange={(e) => {
                  const val = e.target.value;
                  setTeacherSubjects((prev) =>
                    prev.map((item, i) =>
                      i === idx ? { ...item, subjectId: val } : item,
                    ),
                  );
                }}
                className="border p-2 flex-1"
                required
              >
                <option value="">Выберите предмет</option>
                {subjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={1}
                value={ts.duration}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setTeacherSubjects((prev) =>
                    prev.map((item, i) =>
                      i === idx ? { ...item, duration: val } : item,
                    ),
                  );
                }}
                className="border p-2 w-24"
                placeholder="мин"
                required
              />

              <input
                type="number"
                min={0}
                value={ts.price}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setTeacherSubjects((prev) =>
                    prev.map((item, i) =>
                      i === idx ? { ...item, price: val } : item,
                    ),
                  );
                }}
                className="border p-2 w-24"
                placeholder="цена"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setTeacherSubjects((prev) =>
                    prev.filter((_, i) => i !== idx),
                  )
                }
                className="text-red-500 px-2"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setTeacherSubjects((prev) => [
                ...prev,
                { subjectId: '', duration: 60, price: 0 },
              ])
            }
            className="mt-2 bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
          >
            + Добавить предмет
          </button>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded"
        >
          Сохранить
        </button>
      </form>
    </div>
  );
}

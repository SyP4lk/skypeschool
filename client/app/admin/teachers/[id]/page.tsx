'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const API = '/api';

/**
 * Страница редактирования преподавателя.
 * Администратор может поменять только имя, фамилию, фото и краткое описание.
 */
export default function EditTeacherPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [aboutShort, setAboutShort] = useState("");

  // предпросмотр текущего/нового фото
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  // новое фото как файл
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // список всех предметов
  const [subjectsList, setSubjectsList] = useState<{ id: string; name: string }[]>([]);
  // предметы преподавателя
  const [teacherSubjects, setTeacherSubjects] = useState<{
    subjectId: string;
    price: number;
    duration: number;
  }[]>([]);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        // все предметы
        const subjRes = await fetch(`${API}/subjects`, { credentials: "include" });
        if (subjRes.ok) {
          const subj = await subjRes.json();
          if (Array.isArray(subj)) {
            setSubjectsList(subj.map((s: any) => ({ id: s.id, name: s.name })));
          }
        }

        // данные преподавателя
        const tRes = await fetch(`${API}/admin/teachers/${id}`, { credentials: "include" });
        if (!tRes.ok) throw new Error(await tRes.text().catch(() => 'Ошибка загрузки преподавателя'));
        const data = await tRes.json();

        setFirstName(data?.user?.firstName || "");
        setLastName(data?.user?.lastName || "");
        setAboutShort(data?.aboutShort || "");

        // предпросмотр фото: если относительный путь — ведём через /api/...
        const _p = (data?.photo as string | null) || null;
        setPhotoPreview(_p ? (_p.startsWith('http') ? _p : `/api/${_p.replace(/^\/+/, '')}`) : null);

        if (Array.isArray(data?.teacherSubjects)) {
          setTeacherSubjects(
            data.teacherSubjects.map((ts: any) => ({
              subjectId: ts.subjectId ?? ts.subject?.id ?? "",
              price: Number(ts.price ?? 0),
              duration: Number(ts.duration ?? 60),
            }))
          );
        }
      } catch (e: any) {
        setError(e?.message || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      // 1) Если выбран файл — заливаем и сохраняем URL
      if (photoFile) {
        const fd = new FormData();
        fd.append('file', photoFile);

        const up = await fetch(`${API}/admin/teachers/${id}/upload`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });

        const upJson = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(upJson?.message || 'Ошибка загрузки фото');

        const uploadedUrl: string | null = upJson?.url || null;
        if (uploadedUrl) {
          const patch = await fetch(`${API}/admin/teachers/${id}/photo`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ url: uploadedUrl }),
          });
          if (!patch.ok) {
            const t = await patch.text().catch(() => '');
            throw new Error(t || 'Не удалось сохранить фото преподавателя');
          }
        }
      }

      // 2) PUT JSON с основными полями
      const payload = {
        firstName,
        lastName,
        aboutShort,
        teacherSubjects, // [{subjectId, price, duration}]
      };

      const res = await fetch(`${API}/admin/teachers/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || 'Не удалось сохранить изменения');
      }

      router.push('/admin/teachers');
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения');
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Удалить преподавателя?")) return;
    const res = await fetch(`${API}/admin/teachers/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      router.push("/admin/teachers");
    } else {
      alert("Ошибка удаления");
    }
  }

  if (loading) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Редактирование преподавателя</h1>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
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
                  setTeacherSubjects(prev =>
                    prev.map((item, i) => (i === idx ? { ...item, subjectId: val } : item))
                  );
                }}
                className="border p-2 flex-1"
                required
              >
                <option value="">Выберите предмет</option>
                {subjectsList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <input
                type="number"
                min={1}
                value={ts.duration}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setTeacherSubjects(prev =>
                    prev.map((item, i) => (i === idx ? { ...item, duration: val } : item))
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
                  const val = Number(e.target.value) || 0;
                  setTeacherSubjects(prev =>
                    prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
                  );
                }}
                className="border p-2 w-24"
                placeholder="цена"
                required
              />

              <button
                type="button"
                onClick={() => setTeacherSubjects(prev => prev.filter((_, i) => i !== idx))}
                className="px-2 text-red-500"
                title="Удалить предмет"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setTeacherSubjects(prev => [...prev, { subjectId: "", duration: 60, price: 0 }])
            }
            className="mt-2 rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
          >
            + Добавить предмет
          </button>
        </div>

        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Сохранить
        </button>
      </form>

      <button
        onClick={handleDelete}
        className="mt-4 rounded bg-red-600 px-4 py-2 text-white"
      >
        Удалить
      </button>
    </div>
  );
}

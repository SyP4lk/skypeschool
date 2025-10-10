const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

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
  // храним текущий путь к фото для предпросмотра
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  // новое фото загружается как файл
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  // список всех предметов для выбора
  const [subjectsList, setSubjectsList] = useState<{ id: string; name: string }[]>([]);
  // список предметов преподавателя с ценой и длительностью
  const [teacherSubjects, setTeacherSubjects] = useState<{
    subjectId: string;
    price: number;
    duration: number;
  }[]>([]);

  useEffect(() => {
    if (!id) return;
    // загружаем список всех предметов
    fetch(`${API}/subjects`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSubjectsList(data.map((s: any) => ({ id: s.id, name: s.name })));
        }
      })
      .catch(() => {});
    // загружаем данные преподавателя
    fetch(`${API}/admin/teachers/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setFirstName(data.user.firstName || "");
        setLastName(data.user.lastName || "");
        setAboutShort(data.aboutShort || "");
        // для предпросмотра устанавливаем полный путь (можно добавить BASE_URL)
        // удаляем суффикс /api у API_URL, если он есть, чтобы получить базовый адрес для изображений
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '')?.replace(/\/api$/, '') ?? '';
        setPhotoPreview(data.photo ? `${baseUrl}${data.photo}` : null);
        // преобразуем teacherSubjects в массив объектов с необходимыми полями
        if (Array.isArray(data.teacherSubjects)) {
          setTeacherSubjects(
            data.teacherSubjects.map((ts: any) => ({
              subjectId: ts.subjectId ?? ts.subject?.id ?? "",
              price: ts.price ?? 0,
              duration: ts.duration ?? 60,
            }))
          );
        }
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // собираем FormData для отправки
    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("aboutShort", aboutShort);
    formData.append("teacherSubjects", JSON.stringify(teacherSubjects));
    if (photoFile) {
      formData.append("photo", photoFile);
    }
    const res = await fetch(`${API}/admin/teachers/${id}`, {
      method: "PUT",
      credentials: "include",
      body: formData,
    });
    if (res.ok) {
      router.push("/admin/teachers");
    } else {
      const text = await res.text();
      setError(text || "Ошибка");
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
      {error && <p className="text-red-600 mb-4">{error}</p>}
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
                reader.onload = () => {
                  setPhotoPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
            className="border p-2 w-full"
          />
          {/* Показываем превью либо текущее фото, если новое не выбрано */}
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
                      i === idx ? { ...item, subjectId: val } : item
                    )
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
                      i === idx ? { ...item, duration: val } : item
                    )
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
                      i === idx ? { ...item, price: val } : item
                    )
                  );
                }}
                className="border p-2 w-24"
                placeholder="цена"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setTeacherSubjects((prev) => prev.filter((_, i) => i !== idx))
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
                { subjectId: "", duration: 60, price: 0 },
              ])
            }
            className="mt-2 bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
          >
            + Добавить предмет
          </button>
        </div>
        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded">
          Сохранить
        </button>
      </form>
      <button
        onClick={handleDelete}
        className="mt-4 bg-red-600 text-white py-2 px-4 rounded"
      >
        Удалить
      </button>
    </div>
  );
}
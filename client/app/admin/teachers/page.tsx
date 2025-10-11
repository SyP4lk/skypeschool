"use client";
const API = '/api';


import { useEffect, useState } from "react";
import Link from "next/link";

type TeacherForAdmin = {
  id: string;
  user: {
    login: string;
    firstName: string;
    lastName: string;
  };
};

/**
 * Страница списка преподавателей для админ‑панели.
 */
export default function TeachersAdminPage() {
  const [teachers, setTeachers] = useState<TeacherForAdmin[]>([]);

  useEffect(() => {
    fetch(`${API}/admin/teachers`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setTeachers);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Преподаватели</h1>
      <Link href="/admin/teachers/new" className="inline-block bg-blue-600 text-white py-2 px-4 rounded mb-4">
        Добавить
      </Link>
      <table className="min-w-full border text-left">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Имя</th>
            <th className="py-2 px-4 border-b">Логин</th>
            <th className="py-2 px-4 border-b" />
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => (
            <tr key={t.id}>
              <td className="py-2 px-4 border-b">
                {t.user.firstName} {t.user.lastName}
              </td>
              <td className="py-2 px-4 border-b">{t.user.login}</td>
              <td className="py-2 px-4 border-b">
                <Link href={`/admin/teachers/${t.id}`} className="text-blue-600 hover:underline">
                  Редактировать
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
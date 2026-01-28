'use client';
import { useEffect, useState } from 'react';
import { api } from '../_lib/api';
import Button from '../../components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardTitle } from '@/components/ui/Card';
import { fullName } from '../_lib/fullName';

export default function LessonsPage(){
  const [lessons, setLessons] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [teacherId, setTeacherId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState('60');
  const [channel, setChannel] = useState('skype');
  const [note, setNote] = useState('');

  async function load(){
    const [ls, ts, ss, subs] = await Promise.all([api('/lessons'), api('/teachers'), api('/students'), api('/subjects')]);
    setLessons(ls); setTeachers(ts); setStudents(ss); setSubjects(subs);
    if(ts[0]) setTeacherId(ts[0].user?.id ?? ts[0].id);
    if(ss[0]) setStudentId(ss[0].id);
    if(subs[0]) setSubjectId(subs[0].id);
  }
  useEffect(()=>{ load(); }, []);

  async function create(){
    await api('/lessons', { method:'POST', body: JSON.stringify({ teacherId, studentId, subjectId, startsAt, duration: Number(duration), channel, note }) });
    setNote(''); load();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Назначить урок</CardTitle>
        <div className="grid grid-cols-7 gap-3 max-w-6xl">
          <Select value={teacherId} onChange={e=>setTeacherId(e.target.value)}>
            {teachers.map((t:any)=>(
              <option key={t.id} value={t.user?.id}>{fullName(t.user)}</option>
            ))}
          </Select>
          <Select value={studentId} onChange={e=>setStudentId(e.target.value)}>
            {students.map((s:any)=>(
              <option key={s.id} value={s.id}>{fullName(s)}</option>
            ))}
          </Select>
          <Select value={subjectId} onChange={e=>setSubjectId(e.target.value)}>
            {subjects.map((s:any)=>(<option key={s.id} value={s.id}>{s.name}</option>))}
          </Select>
          <Input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} />
          <Input placeholder="мин" value={duration} onChange={e=>setDuration(e.target.value)} />
          <Select value={channel} onChange={e=>setChannel(e.target.value)}>
            <option value="skype">Skype</option>
            <option value="zoom">Zoom</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
            <option value="other">Other</option>
          </Select>
          <Button onClick={create}>Назначить</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Список уроков</CardTitle>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500"><th>Когда</th><th>Учитель</th><th>Ученик</th><th>Предмет</th><th>Длит.</th><th>Канал</th></tr></thead>
          <tbody>
            {lessons.map((l:any)=>(
              <tr key={l.id} className="border-t">
                <td className="py-2">{new Date(l.startsAt).toLocaleString()}</td>
                <td>{fullName(l.teacher)}</td>
                <td>{fullName(l.student)}</td>
                <td className="py-2">{l.subject?.name}</td>
                <td className="py-2">{l.duration} мин</td>
                <td className="py-2">{l.channel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

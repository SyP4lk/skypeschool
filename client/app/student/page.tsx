// client/app/student/page.tsx
import { redirect } from 'next/navigation';

export default function LegacyStudentPage() {
  // Единственная задача этого роута — переадресовать на актуальный ЛК
  redirect('/lk/student');
}

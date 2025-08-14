import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/legacy/home_assets/logo-test.svg" alt="SkypeSchool" className="h-9" />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/all-teachers" className="hover:text-blue-600 transition-colors">Преподаватели</Link>
          <Link href="/prices" className="hover:text-blue-600 transition-colors">Стоимость</Link>
          <Link href="/about" className="hover:text-blue-600 transition-colors">О нас</Link>
          <Link href="/faq" className="hover:text-blue-600 transition-colors">FAQ</Link>
        </nav>
        <Link href="/auth/signin" className="inline-flex items-center gap-2 text-sm font-medium">
          <span>Вход</span>
        </Link>
      </div>
    </header>
  );
}

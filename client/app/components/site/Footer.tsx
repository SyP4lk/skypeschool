export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="container-fluid py-8 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/client/public/logo.jpg" className="h-6" alt="Logo" />
          <span>© {new Date().getFullYear()} Skype School</span>
        </div>
        <nav className="flex gap-4">
          <a href="#" className="hover:text-black">Контакты</a>
          <a href="#" className="hover:text-black">Политика</a>
        </nav>
      </div>
    </footer>
  );
}

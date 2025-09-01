// app/(public)/contacts/page.tsx
import Link from 'next/link';
import ContactForm from './ContactForm';

export default function ContactPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Контакты</h1>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Левая колонка */}
        <section>
          <ul className="space-y-2">
            <li><a href="tel:+79061268888">+7 906 126-88-88</a></li>
            <li><a href="tel:+79093443705">+7 909 344-37-05</a></li>
            <li><a href="mailto:info@skype-school.com">info@skype-school.com</a></li>
            
          </ul>

          <div className="mt-5">
            <div className="text-sm text-gray-500 mb-2">Часы работы</div>
            <div className="inline-flex items-center rounded-md border px-3 py-1.5">
              круглосуточно
            </div>
          </div>

          {/* Соцсети — иконки */}
          <div className="mt-6 flex items-center gap-4">
            <a href="https://vk.com/id147351527" target="_blank" rel="noopener noreferrer" aria-label="VK">
              <img src="/social_vk.svg" alt="VK" width={28} height={28} />
            </a>
            <a href="https://t.me/skype_school_marina" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
              <img src="/telegram.svg" alt="Telegram" width={28} height={28} />
            </a>
            <a href="https://www.instagram.com/skype_school_marina/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <img src="/instagram.svg" alt="Instagram" width={28} height={28} />
            </a>
            <a href="https://wa.me/79093443705" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <img src="/whatsapp.svg" alt="WhatsApp" width={28} height={28} />
            </a>
          </div>
        </section>

        {/* Правая колонка — форма */}
        <section>
          <ContactForm />
        </section>
      </div>
    </main>
  );
}

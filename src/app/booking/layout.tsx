import { LanguageSelector } from '@/components/shared/LanguageProvider';
import { t } from '@/lib/i18n';

export default async function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = 'nl'; // Default for now

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">CS</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Care & Service</h1>
                <p className="text-sm text-gray-600">Unified Booking Platform</p>
              </div>
            </div>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                {t('navigation.home', locale)}
              </a>
              <a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                {t('navigation.about', locale)}
              </a>
              <a href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                {t('navigation.contact', locale)}
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Care & Service</h3>
              <p className="text-gray-300">
                Professional care and services in multiple languages
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/booking" className="text-gray-300 hover:text-white transition-colors">{t('navigation.booking', locale)}</a></li>
                <li><a href="/services" className="text-gray-300 hover:text-white transition-colors">{t('navigation.services', locale)}</a></li>
                <li><a href="/about" className="text-gray-300 hover:text-white transition-colors">{t('navigation.about', locale)}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-300">
                Email: info@careservice.com<br />
                Phone: +31 123 456 789
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 Care & Service. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
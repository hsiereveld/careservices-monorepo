'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { locales, type Locale, defaultLocale, getLocaleFromPath, getPathWithLocale } from '@/lib/i18n';

interface LanguageContextType {
  currentLocale: Locale;
  changeLocale: (locale: Locale) => void;
  availableLocales: Locale[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLocale, setCurrentLocale] = useState<Locale>(defaultLocale);
  const router = useRouter();
  const pathname = usePathname();

  // Detect locale from pathname on mount
  useEffect(() => {
    const detectedLocale = getLocaleFromPath(pathname);
    setCurrentLocale(detectedLocale);
  }, [pathname]);

  const changeLocale = (locale: Locale) => {
    setCurrentLocale(locale);
    
    // Update URL with new locale
    const newPath = getPathWithLocale(pathname, locale);
    router.push(newPath);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLocale,
        changeLocale,
        availableLocales: locales,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Language Selector Component
export function LanguageSelector() {
  const { currentLocale, changeLocale, availableLocales } = useLanguage();
  
  const languageNames: Record<Locale, string> = {
    nl: 'Nederlands',
    en: 'English',
    es: 'Español',
  };
  
  const languageFlags: Record<Locale, string> = {
    nl: '🇳🇱',
    en: '🇬🇧',
    es: '🇪🇸',
  };

  return (
    <div className="flex space-x-2 bg-white rounded-lg p-2 shadow-md">
      {availableLocales.map((locale) => (
        <button
          key={locale}
          onClick={() => changeLocale(locale)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            currentLocale === locale
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-100'
          }`}
        >
          <span className="text-lg">{languageFlags[locale]}</span>
          <span className="font-medium">{languageNames[locale]}</span>
        </button>
      ))}
    </div>
  );
} 
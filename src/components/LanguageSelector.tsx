'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Globe, ChevronDown } from 'lucide-react'
import { languages, getLanguageFromPath, getPathWithLanguage, type Language } from '@/lib/i18n'

export default function LanguageSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLanguage = getLanguageFromPath(pathname)
  const currentLang = languages[currentLanguage]

  const handleLanguageChange = (language: Language) => {
    const newPath = getPathWithLanguage(pathname, language)
    router.push(newPath)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {Object.entries(languages).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code as Language)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                  currentLanguage === code ? 'bg-teal-50 text-teal-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <div>
                  <div className="font-medium">{lang.name}</div>
                  <div className="text-xs text-gray-500">{lang.nativeName}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 
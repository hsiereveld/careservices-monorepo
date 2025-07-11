"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown, MapPin, Globe } from "lucide-react";
import Image from "next/image";
import { navigation, getLanguageFromPath, getPathWithLanguage, languages } from "@/lib/i18n";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from '@/shared/hooks/useAuth';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const language = getLanguageFromPath(pathname);
  const nav = navigation[language];
  const { user, signOut } = useAuth();

  const currentLang = languages[language];

  const handleLanguageChange = (langCode: string) => {
    const newPath = getPathWithLanguage(pathname, langCode as any);
    router.push(newPath);
    setIsLanguageOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="Care & Service Pinoso logo"
                width={140}
                height={50}
                className="h-12 w-auto"
                style={{ display: 'block' }}
              />
            </Link>
            
            {/* Location Indicator */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Pinoso, Costa Blanca</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-teal-600 transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              href="/over-ons" 
              className="text-gray-700 hover:text-teal-600 transition-colors font-medium"
            >
              About Us
            </Link>
            <Link 
              href="/diensten" 
              className="text-gray-700 hover:text-teal-600 transition-colors font-medium"
            >
              Services
            </Link>
            <Link 
              href="/hoe-werkt-het" 
              className="text-gray-700 hover:text-teal-600 transition-colors font-medium"
            >
              How It Works
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-700 hover:text-teal-600 transition-colors font-medium"
            >
              Contact
            </Link>
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Book Now Button - Primary CTA */}
            <Link 
              href="/booking" 
              className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-2.5 rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all font-semibold shadow-md"
            >
              Boek Nu
            </Link>
            
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>{currentLang.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    {Object.entries(languages).map(([code, lang]) => (
                      <button
                        key={code}
                        onClick={() => handleLanguageChange(code)}
                        className={`w-full flex items-center space-x-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                          language === code ? 'bg-teal-50 text-teal-700' : 'text-gray-700'
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

            {/* Auth Section */}
            {user ? (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/my" 
                  className="text-teal-600 hover:text-teal-700 transition-colors font-medium"
                >
                  {user?.email || 'Dashboard'}
                </Link>
                <button 
                  onClick={signOut} 
                  className="text-gray-600 hover:text-gray-700 transition-colors"
                >
                  Uitloggen
                </button>
              </div>
            ) : (
              <Link 
                href={getPathWithLanguage("/signup", language)} 
                className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Register
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-teal-600 hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
              {/* Location for mobile */}
              <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Pinoso, Costa Blanca</span>
              </div>
              
              {/* Book Now Button for Mobile */}
              <Link 
                href="/booking" 
                className="block mx-3 mb-3 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 text-center font-semibold shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Boek Nu
              </Link>
              
              <Link 
                href="/" 
                className="block px-3 py-2 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/over-ons" 
                className="block px-3 py-2 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link 
                href="/diensten" 
                className="block px-3 py-2 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link 
                href="/hoe-werkt-het" 
                className="block px-3 py-2 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="/contact" 
                className="block px-3 py-2 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              
              <div className="pt-4 pb-3 border-t border-gray-200">
                {/* Language selector for mobile */}
                <div className="px-3 py-2">
                  <div className="text-sm font-medium text-gray-500 mb-2">Language</div>
                  <div className="space-y-1">
                    {Object.entries(languages).map(([code, lang]) => (
                      <button
                        key={code}
                        onClick={() => {
                          handleLanguageChange(code);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-sm text-left rounded-md transition-colors ${
                          language === code ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Auth for mobile */}
                {user ? (
                  <>
                    <Link 
                      href="/my" 
                      className="block px-3 py-2 text-teal-600 hover:text-teal-700 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {user?.email || 'Dashboard'}
                    </Link>
                    <button 
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }} 
                      className="block px-3 py-2 text-gray-600 hover:text-gray-700"
                    >
                      Uitloggen
                    </button>
                  </>
                ) : (
                  <Link 
                    href={getPathWithLanguage("/signup", language)} 
                    className="block mx-3 mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-center font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 
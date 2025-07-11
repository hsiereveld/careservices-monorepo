import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Building } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary-600 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Building className="w-5 h-5" />
              <span className="font-semibold">Care & Service - Pinoso | Een initiatief van HS Management & Beheer BV</span>
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-100">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>Torenlaan 5B, 1402 AT Bussum, Nederland</span>
              </div>
              
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>Tel: +31 (0)6-34339304</span>
              </div>
              
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>E-mail: h.siereveld@gmail.com</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span>KvK: 32171536</span>
                <span>BTW: NL822369680B01</span>
                <span>Bank: NL22 INGB 0005 365567</span>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-xs">
              <div className="text-primary-200">2025 Care & Service. Alle rechten voorbehouden.</div>
              <Link href="/algemene-voorwaarden" className="text-primary-200 hover:text-white transition-colors">Algemene Voorwaarden</Link>
              <Link href="/privacy" className="text-primary-200 hover:text-white transition-colors">Privacyverklaring</Link>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold">CS</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
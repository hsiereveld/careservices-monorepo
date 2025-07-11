"use client";
import Link from "next/link";

export default function CallToActionSection() {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6 text-white">Klaar om te starten?</h2>
        <p className="text-xl mb-8 text-primary-100">Sluit je aan bij onze Nederlandstalige gemeenschap in Pinoso en maak het leven makkelijker!</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-primary-50 hover:text-primary-700 transition-colors inline-flex items-center justify-center">Start vandaag</Link>
          <Link href="/service-provider-application" className="bg-secondary-500 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-secondary-600 transition-colors inline-flex items-center justify-center border border-primary-400">Word dienstverlener</Link>
        </div>
      </div>
    </section>
  );
} 
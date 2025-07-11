"use client";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">Care & Service Pinoso</h1>
        <p className="text-xl mb-8 max-w-2xl text-primary-100">
          Betrouwbare hulp en ondersteuning voor Nederlandse en Belgische expats in Spanje. Boek eenvoudig een dienst of word zelf dienstverlener!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/signup" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold shadow hover:bg-primary-50 hover:text-primary-700 transition">Dienst boeken</Link>
          <Link href="/service-provider-application" className="bg-secondary-500 text-white px-8 py-3 rounded-lg font-bold shadow hover:bg-secondary-600 transition">Diensten verlenen</Link>
        </div>
        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <span className="inline-flex items-center gap-2 bg-primary-400 px-4 py-2 rounded-full text-sm text-white"><CheckCircle className="w-4 h-4" /> Betrouwbaar</span>
          <span className="inline-flex items-center gap-2 bg-primary-400 px-4 py-2 rounded-full text-sm text-white"><CheckCircle className="w-4 h-4" /> Nederlandstalig</span>
          <span className="inline-flex items-center gap-2 bg-primary-400 px-4 py-2 rounded-full text-sm text-white"><CheckCircle className="w-4 h-4" /> Lokaal netwerk</span>
        </div>
      </div>
    </section>
  );
} 
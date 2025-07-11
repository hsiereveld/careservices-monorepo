"use client";
import Link from "next/link";
import { Gift } from "lucide-react";

export default function OfferSection() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <Gift className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-primary-600 mb-4">Speciale aanbieding</h2>
        <p className="text-lg mb-6 text-text-primary">Nu tijdelijk: 3x hulp voor €99! Profiteer van deze introductiedeal en ervaar het gemak van onze diensten.</p>
        <Link href="/aanbiedingen" className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-bold shadow hover:bg-primary-700 transition">Bekijk deals</Link>
      </div>
    </section>
  );
} 
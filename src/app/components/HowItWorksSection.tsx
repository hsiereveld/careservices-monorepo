"use client";
import { Users, ArrowRight, Star } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-primary-600 text-center mb-10">Hoe werkt het?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <Users className="w-10 h-10 text-primary-600 mb-2" />
            <h3 className="font-bold mb-2 text-secondary-500">1. Kies een dienst</h3>
            <p className="text-center text-text-primary">Bekijk het aanbod en kies de hulp die je nodig hebt.</p>
          </div>
          <div className="flex flex-col items-center">
            <ArrowRight className="w-10 h-10 text-primary-600 mb-2" />
            <h3 className="font-bold mb-2 text-secondary-500">2. Boek eenvoudig online</h3>
            <p className="text-center text-text-primary">Regel alles snel via onze website, zonder gedoe.</p>
          </div>
          <div className="flex flex-col items-center">
            <Star className="w-10 h-10 text-primary-600 mb-2" />
            <h3 className="font-bold mb-2 text-secondary-500">3. Ontvang hulp</h3>
            <p className="text-center text-text-primary">Een betrouwbare Nederlandstalige staat voor je klaar.</p>
          </div>
        </div>
      </div>
    </section>
  );
} 
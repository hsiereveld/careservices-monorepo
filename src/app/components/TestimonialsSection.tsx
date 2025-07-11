"use client";

export default function TestimonialsSection() {
  return (
    <section className="py-16 px-4 bg-background-accent">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-primary-600 text-center mb-10">Ervaringen van anderen</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col h-full border border-gray-200">
            <blockquote className="flex-1 italic text-text-primary mb-4">"Zonder Care & Service Pinoso was ik verloren in de Spaanse papierwinkel. Nu is alles geregeld!"</blockquote>
            <div className="font-bold text-primary-600">Jan de Vries</div>
            <div className="text-sm text-secondary-500">Nederlandse expat</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col h-full border border-gray-200">
            <blockquote className="flex-1 italic text-text-primary mb-4">"Fijne hulp, altijd in het Nederlands. En snel geregeld!"</blockquote>
            <div className="font-bold text-primary-600">Marieke Jansen</div>
            <div className="text-sm text-secondary-500">Belgische expat</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col h-full border border-gray-200">
            <blockquote className="flex-1 italic text-text-primary mb-4">"De oppasdienst voor mijn hond was top geregeld. Aanrader!"</blockquote>
            <div className="font-bold text-primary-600">Piet Bakker</div>
            <div className="text-sm text-secondary-500">Nederlandse expat</div>
          </div>
        </div>
      </div>
    </section>
  );
} 
"use client";
import { Home as HomeIcon, Car, Heart } from "lucide-react";

export default function ServicesSection() {
  return (
    <section className="py-16 px-4 bg-background-accent">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-primary-600 text-center mb-10">Onze diensten</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center border border-gray-200">
            <HomeIcon className="w-10 h-10 text-primary-600 mb-2" />
            <h3 className="font-bold mb-2 text-secondary-500">Huishoudelijke hulp</h3>
            <p className="text-center text-text-primary">Schoonmaak, boodschappen, koken en meer. Altijd een vertrouwd gezicht in huis.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center border border-gray-200">
            <Car className="w-10 h-10 text-primary-600 mb-2" />
            <h3 className="font-bold mb-2 text-secondary-500">Vervoer & begeleiding</h3>
            <p className="text-center text-text-primary">Vervoer naar afspraken, begeleiding bij arts of instanties, hulp bij administratie.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center border border-gray-200">
            <Heart className="w-10 h-10 text-primary-600 mb-2" />
            <h3 className="font-bold mb-2 text-secondary-500">Gezelschap & oppas</h3>
            <p className="text-center text-text-primary">Gezelschap, oppas voor ouderen of huisdieren, een luisterend oor en praktische hulp.</p>
          </div>
        </div>
      </div>
    </section>
  );
} 
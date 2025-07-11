"use client";
import Link from "next/link";
import { Users, Home as HomeIcon, Car, Heart, CheckCircle, Star, Gift, ArrowRight } from "lucide-react";
import Header from "./components/Header";
import FooterSection from "./components/FooterSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Care & Service Pinoso
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Betrouwbare ondersteuning voor Nederlandse en Belgische expats in Spanje
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/booking" 
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Dienst boeken
              </Link>
              <Link 
                href="/professional-signup" 
                className="border border-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Diensten verlenen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Onze Diensten
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <HomeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Huishoudelijke hulp
              </h3>
              <p className="text-gray-600">
                Van schoonmaak tot boodschappen, wij zorgen dat je huis er perfect uitziet.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Vervoer & begeleiding
              </h3>
              <p className="text-gray-600">
                Veilig vervoer naar doktersafspraken, boodschappen of sociale activiteiten.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Ouderenzorg
              </h3>
              <p className="text-gray-600">
                Professionele zorg en ondersteuning voor ouderen in hun eigen taal.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}

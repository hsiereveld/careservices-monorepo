"use client";
import Link from "next/link";
import { Users, Heart, Shield, Globe, Star, CheckCircle } from "lucide-react";
import Header from "../components/Header";
import FooterSection from "../components/FooterSection";

export default function OverOnsPage() {
  const values = [
    {
      icon: Heart,
      title: "Betrouwbaarheid",
      description: "Al onze dienstverleners zijn zorgvuldig geselecteerd en geverifieerd."
    },
    {
      icon: Users,
      title: "Nederlandstalig",
      description: "Alle communicatie verloopt in het Nederlands voor maximale duidelijkheid."
    },
    {
      icon: Shield,
      title: "Veiligheid",
      description: "Uw veiligheid en privacy staan voorop in alles wat we doen."
    },
    {
      icon: Globe,
      title: "Lokaal netwerk",
      description: "We werken met lokale dienstverleners die de regio goed kennen."
    }
  ];

  const team = [
    {
      name: "Henk Siereveld",
      role: "Oprichter & Eigenaar",
      description: "Oprichter van Care & Service Pinoso, met passie voor het ondersteunen van expats in Spanje. Meer dan 10 jaar ervaring in het verbinden van mensen en het bieden van betrouwbare hulp in de regio Pinoso.",
      image: null
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Over Care & Service Pinoso
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Meer dan alleen service - een gemeenschap van Nederlandse en Belgische immigranten die elkaar helpen
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-primary-600 mb-6">Onze Missie</h2>
            <p className="text-xl text-gray-600 mb-8">
              "Betrouwbare ondersteuning voor en door Nederlandse en Belgische immigranten en expats in Pinoso"
            </p>
            <div className="grid md:grid-cols-4 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">10+</div>
                <div className="text-gray-600">Jaar ervaring</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">100+</div>
                <div className="text-gray-600">Tevreden klanten</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">98%</div>
                <div className="text-gray-600">Tevredenheidsscore</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">100%</div>
                <div className="text-gray-600">Betrouwbaarheid</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary-600 mb-12">
            Onze Bedrijfsfilosofie
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Meer dan alleen service</h3>
              <p className="text-gray-600">
                Gemeenschap van Nederlandse en Belgische immigranten die elkaar helpen in het dagelijkse leven.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Flexibiliteit</h3>
              <p className="text-gray-600">
                Planning wanneer het de klant uitkomt. Wij passen ons aan jouw leven aan, niet andersom.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Transparantie</h3>
              <p className="text-gray-600">
                Eerlijke prijzen zonder verborgen kosten. Wat je ziet, is wat je betaalt.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Persoonlijke benadering</h3>
              <p className="text-gray-600">
                Elke situatie is uniek en verdient maatwerk. Geen standaardoplossingen.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">100% Betrouwbaarheid</h3>
              <p className="text-gray-600">
                Bewezen track record over 10+ jaar. Onze klanten vertrouwen ons hun kostbaarste bezittingen toe.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Lokale expertise</h3>
              <p className="text-gray-600">
                Diepgaande kennis van de lokale situatie in Pinoso en omgeving.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-primary-600 mb-12">
              Ontmoet de Oprichter
            </h2>
            
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 md:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="lg:w-1/3">
                  <div className="w-48 h-48 bg-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-6xl">👨‍💼</div>
                  </div>
                </div>
                
                <div className="lg:w-2/3">
                  <h3 className="text-3xl font-bold text-primary-600 mb-2">Henk Siereveld</h3>
                  <p className="text-xl text-accent-600 mb-4">Oprichter & Eigenaar Care & Service Pinoso</p>
                  
                  <div className="space-y-4 text-gray-600">
                    <p>
                      <strong>Locatie:</strong> El Pinós / Pinoso, Valencian Community<br />
                      <strong>Achtergrond:</strong> Ondernemer, adviseur en verbinder<br />
                      <strong>Netwerk:</strong> Meer dan 1000 connecties<br />
                      <strong>Ervaring:</strong> 10+ jaar in het helpen van mensen
                    </p>
                    
                    <div className="bg-white p-6 rounded-xl">
                      <h4 className="text-xl font-bold text-primary-600 mb-3">Persoonlijke Missie</h4>
                      <p className="text-gray-600 italic text-lg mb-4">
                        "Niemand hoeft de uitdagingen van het immigranten- en expat-leven alleen aan te gaan"
                      </p>
                      
                      <h4 className="text-lg font-semibold text-primary-600 mb-2">Wat hem drijft:</h4>
                      <ul className="space-y-2 text-gray-600">
                        <li>• <strong>Gemeenschapsgevoel:</strong> Samen zijn we sterker dan alleen</li>
                        <li>• <strong>Betrouwbaarheid:</strong> Doen wat je belooft, altijd</li>
                        <li>• <strong>Persoonlijke benadering:</strong> Elke situatie is uniek en verdient maatwerk</li>
                        <li>• <strong>Transparantie:</strong> Eerlijke communicatie en faire prijzen</li>
                      </ul>
                    </div>
                    
                    <blockquote className="text-xl text-primary-600 font-semibold italic text-center border-l-4 border-primary-600 pl-4">
                      "In Pinoso hebben we elkaar - en dat maakt alle verschil."
                    </blockquote>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary-600 mb-12">
            Waarom kiezen voor Care & Service Pinoso?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div>
              <h3 className="text-2xl font-bold text-primary-600 mb-6">1. Flexibiliteit die past bij jouw leven</h3>
              <ul className="space-y-3 text-gray-600">
                <li>• Eenmalige hulp of regelmatige ondersteuning</li>
                <li>• Maatwerk, geen starre schema's</li>
                <li>• Planning die aansluit bij jouw behoeften</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-primary-600 mb-6">2. Transparantie in alles</h3>
              <ul className="space-y-3 text-gray-600">
                <li>• Eerlijke prijzen zonder verborgen kosten</li>
                <li>• Duidelijke communicatie over wat je kunt verwachten</li>
                <li>• Abonnementen, kortingen en servicebundels beschikbaar</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-primary-600 mb-6">3. Persoonlijke benadering</h3>
              <ul className="space-y-3 text-gray-600">
                <li>• Luisteren naar je specifieke behoeften</li>
                <li>• Geen standaardoplossingen, maar maatwerk</li>
                <li>• Persoonlijke relaties met klanten en professionals</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-primary-600 mb-6">4. 100% Betrouwbaarheid</h3>
              <ul className="space-y-3 text-gray-600">
                <li>• Meer dan 10 jaar bewezen betrouwbaarheid</li>
                <li>• Klanten vertrouwen ons hun huis, huisdieren en kwetsbare momenten toe</li>
                <li>• Uitgebreide screening van alle professionals</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Status */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-primary-600 mb-6">Team in Opbouw</h2>
            <p className="text-xl text-gray-600 mb-8">
              We zijn voortdurend op zoek naar enthousiaste professionals die willen bijdragen aan onze gemeenschap
            </p>
            
            <div className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-primary-600 mb-6">Gezochte Professionals</h3>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg">
                  <div className="text-3xl mb-3">🏥</div>
                  <h4 className="font-bold text-gray-800 mb-2">Zorgprofessionals</h4>
                  <p className="text-sm text-gray-600">
                    Persoonlijke zorg, ouderenbegeleiding, medische ondersteuning
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg">
                  <div className="text-3xl mb-3">🏠</div>
                  <h4 className="font-bold text-gray-800 mb-2">Huishoudelijke Hulp</h4>
                  <p className="text-sm text-gray-600">
                    Schoonmaak, wasservice, algemeen huishoudelijk werk
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg">
                  <div className="text-3xl mb-3">🔧</div>
                  <h4 className="font-bold text-gray-800 mb-2">Technische Experts</h4>
                  <p className="text-sm text-gray-600">
                    Reparaties, onderhoud, technische ondersteuning
                  </p>
                </div>
              </div>
              
              <div className="bg-primary-100 p-6 rounded-lg">
                <h4 className="font-bold text-primary-600 mb-2">Vereisten:</h4>
                <p className="text-primary-700">
                  Nederlands of Vlaams sprekend, wonend in regio Pinoso, passie voor het helpen van anderen
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Deel van onze gemeenschap worden?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Of je nu hulp nodig hebt of hulp wilt bieden, wij verwelkomen je graag in onze gemeenschap
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Neem Contact Op
            </button>
            <button className="bg-accent-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-accent-700 transition-colors">
              Word Professional
            </button>
          </div>
        </div>
      </section>
    </div>
  );
} 
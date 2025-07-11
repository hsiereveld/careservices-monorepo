"use client";
import Header from "../components/Header";
import FooterSection from "../components/FooterSection";
import Link from "next/link";

export default function HoeWerktHetPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Hoe Werkt Het?
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Ontdek hoe eenvoudig het is om hulp te vinden of je diensten aan te bieden via ons platform
          </p>
        </div>
      </div>

      {/* Voor Klanten Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-600 mb-4">Voor Klanten</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              In 5 eenvoudige stappen vind je de perfecte hulp voor jouw situatie
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center mb-16">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    1
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Maak een account aan</h3>
                </div>
                <ul className="space-y-2 text-gray-600">
                  <li>• Gratis account aanmaken</li>
                  <li>• Selecteer "Ik zoek hulp" tijdens registratie</li>
                  <li>• Persoonlijk profiel invullen</li>
                  <li>• Veilig & vertrouwd</li>
                  <li>• Eenvoudig proces (enkele minuten)</li>
                </ul>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-gray-600">
                    Start je reis naar betrouwbare hulp met een snelle, gratis registratie. 
                    Vertel ons wat voor hulp je zoekt.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center mb-16">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pl-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    2
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Zoek de juiste dienst</h3>
                </div>
                <ul className="space-y-2 text-gray-600">
                  <li>• Blader door categorieën of gebruik zoekfunctie</li>
                  <li>• Filter op categorie, prijs of beschikbaarheid</li>
                  <li>• Bekijk beoordelingen van andere klanten</li>
                  <li>• Zoek op trefwoorden</li>
                </ul>
                <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                  <h4 className="font-semibold text-primary-600 mb-2">Beschikbare categorieën:</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm text-gray-600">
                    <div>• Persoonlijke Zorg</div>
                    <div>• Transport & Begeleiding</div>
                    <div>• Administratieve Hulp</div>
                    <div>• Huishoudelijke Hulp</div>
                    <div>• Huisdierenzorg</div>
                    <div>• Technische Hulp</div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-gray-600">
                    Vind precies wat je nodig hebt met onze geavanceerde zoek- en filterfuncties. 
                    Lees reviews van andere klanten.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center mb-16">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    3
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Boek je dienst</h3>
                </div>
                <ul className="space-y-2 text-gray-600">
                  <li>• Selecteer dienst en professional</li>
                  <li>• Kies datum en tijd</li>
                  <li>• Vul adres en contactgegevens in</li>
                  <li>• Prijzen inclusief BTW</li>
                  <li>• Betaling na bevestiging door professional</li>
                  <li>• Bevestigingsmail met details</li>
                </ul>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-gray-600">
                    Boek direct online met een paar klikken. 
                    Kies je gewenste datum en tijd, en ontvang directe bevestiging.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col md:flex-row-reverse items-center mb-16">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pl-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    4
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Beheer je boekingen</h3>
                </div>
                <ul className="space-y-2 text-gray-600">
                  <li>• Persoonlijk dashboard</li>
                  <li>• Bekijk, wijzig of annuleer boekingen</li>
                  <li>• Facturen inzien en betalingen beheren</li>
                  <li>• Aankomende boekingen overzicht</li>
                  <li>• Annuleringsbeleid: tot 24 uur van tevoren kosteloos</li>
                </ul>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-600">
                    Houd alles overzichtelijk in je persoonlijke dashboard. 
                    Beheer je boekingen en bekijk je historie.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    5
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Laat een beoordeling achter</h3>
                </div>
                <ul className="space-y-2 text-gray-600">
                  <li>• Beoordeling na afloop van dienst</li>
                  <li>• Score van 1-5 sterren</li>
                  <li>• Korte recensie schrijven</li>
                  <li>• Helpt andere klanten en professionals</li>
                </ul>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="text-4xl mb-4">⭐</div>
                  <p className="text-gray-600">
                    Deel je ervaring met anderen. Je review helpt andere klanten 
                    en zorgt voor kwaliteitsverbetering.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Voor Professionals Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-600 mb-4">Voor Professionals</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start je eigen business en verdien geld met je vaardigheden
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Professional Step 1 */}
            <div className="flex flex-col md:flex-row items-center mb-16">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-accent-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    1
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Maak een professional account aan</h3>
                </div>
                <ul className="space-y-2 text-gray-600">
                  <li>• Gratis account aanmaken</li>
                  <li>• Selecteer "Ik bied hulp aan" tijdens registratie</li>
                  <li>• Professional profiel invullen</li>
                  <li>• Verificatieproces doorlopen</li>
                  <li>• Eenvoudig proces (enkele minuten)</li>
                </ul>
              </div>
              <div className="md:w-1/2">
                <div className="bg-accent-50 p-6 rounded-xl shadow-lg border border-accent-200">
                  <div className="text-4xl mb-4">💼</div>
                  <p className="text-gray-600">
                    Start je ondernemersreis met een professioneel profiel. 
                    Toon je expertise en ervaring aan potentiële klanten.
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Step 2 - Pricing Model */}
            <div className="flex flex-col md:flex-row-reverse items-center mb-16">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pl-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-accent-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    2
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Stel je diensten in</h3>
                </div>
                <ul className="space-y-2 text-gray-600">
                  <li>• Configureer welke diensten je aanbiedt</li>
                  <li>• Stel prijzen in</li>
                  <li>• Voeg details toe over expertise</li>
                </ul>
                
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Het prijsmodel:</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <div>1. Jouw prijs (wat jij ontvangt per eenheid)</div>
                    <div>2. Commissie (voor het platform) - standaard 15%</div>
                    <div>3. BTW (21%)</div>
                    <div>4. Verkoopprijs (wat de klant betaalt)</div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <h4 className="font-semibold text-primary-700 mb-2">Voorbeeld berekening (€70 uurtarief):</h4>
                  <div className="text-sm text-primary-600 space-y-1">
                    <div>• Jouw prijs: €70,00</div>
                    <div>• Commissie: €10,50 (15% van €70)</div>
                    <div>• Netto prijs: €80,50 (jouw prijs + commissie)</div>
                    <div>• BTW: €16,91 (21% van €80,50)</div>
                    <div className="font-semibold">• Verkoopprijs: €97,41 (wat de klant betaalt)</div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-accent-50 p-6 rounded-xl shadow-lg border border-accent-200">
                  <div className="text-4xl mb-4">💰</div>
                  <p className="text-gray-600">
                    Stel je eigen prijzen in en bepaal welke diensten je aanbiedt. 
                    Transparante commissiestructuur zonder verrassingen.
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Step 3 */}
            <div className="flex flex-col md:flex-row items-center mb-16">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-accent-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    3
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Stel je beschikbaarheid in</h3>
                </div>
                <ul className="space-y-2 text-gray-600">
                  <li>• Geef aan wanneer je beschikbaar bent voor boekingen</li>
                  <li>• Algemene beschikbaarheid per dag van de week en tijdslot</li>
                  <li>• Specifieke uitzonderingen (vakantie, andere verplichtingen)</li>
                  <li>• Houd beschikbaarheid up-to-date</li>
                </ul>
              </div>
              <div className="md:w-1/2">
                <div className="bg-accent-50 p-6 rounded-xl shadow-lg border border-accent-200">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-gray-600">
                    Beheer je agenda flexibel. Werk wanneer het jou uitkomt 
                    en blokkeer tijden wanneer je niet beschikbaar bent.
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Step 4 */}
            <div className="flex flex-col md:flex-row-reverse items-center mb-16">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pl-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-accent-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    4
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Beheer je boekingen</h3>
                </div>
                <ul className="space-y-2 text-gray-600">
                  <li>• Bekijk en beheer inkomende boekingsaanvragen</li>
                  <li>• Accepteer of weiger aanvragen</li>
                  <li>• Communiceer met klanten</li>
                  <li>• Houd agenda bij</li>
                </ul>
                
                <div className="mt-4 p-4 bg-accent-50 rounded-lg">
                  <h4 className="font-semibold text-accent-700 mb-2">Boekingsworkflow:</h4>
                  <div className="text-sm text-accent-600 space-y-1">
                    <div>1. Nieuwe aanvraag - je ontvangt boekingsaanvraag van klant</div>
                    <div>2. Accepteren of weigeren - afhankelijk van beschikbaarheid</div>
                    <div>3. Dienst uitvoeren - op afgesproken datum en tijd</div>
                    <div>4. Afronden - markeer dienst als voltooid en ontvang betaling</div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-accent-50 p-6 rounded-xl shadow-lg border border-accent-200">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-gray-600">
                    Eenvoudig boekingsbeheer via je dashboard. 
                    Communiceer direct met klanten en houd alles overzichtelijk.
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Step 5 */}
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-accent-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    5
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Ontvang betalingen</h3>
                </div>
                <ul className="space-y-2 text-gray-600">
                  <li>• Automatische verwerking van betalingen via platform</li>
                  <li>• Ontvang vergoeding na aftrek van platformcommissie</li>
                  <li>• Bekijk inkomsten en facturen in dashboard</li>
                </ul>
              </div>
              <div className="md:w-1/2">
                <div className="bg-accent-50 p-6 rounded-xl shadow-lg border border-accent-200">
                  <div className="text-4xl mb-4">💳</div>
                  <p className="text-gray-600">
                    Veilige en snelle betalingen. Je ontvangt je vergoeding automatisch 
                    na voltooiing van de dienst.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary-600 mb-12">
            Waarom kiezen voor Care & Service Pinoso?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Flexibiliteit die past bij jouw leven</h3>
              <p className="text-gray-600">Eenmalige hulp of regelmatige ondersteuning. Maatwerk, geen starre schema's.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Transparantie in alles</h3>
              <p className="text-gray-600">Eerlijke prijzen zonder verborgen kosten. Abonnementen, kortingen en servicebundels.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Persoonlijke benadering</h3>
              <p className="text-gray-600">Luisteren naar specifieke behoeften. Geen standaardoplossingen.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">100% Betrouwbaarheid</h3>
              <p className="text-gray-600">Meer dan 10 jaar bewezen betrouwbaarheid. Klanten vertrouwen hun huis, huisdieren en kwetsbare momenten toe.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Klaar om te beginnen?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Sluit je aan bij onze gemeenschap van Nederlandse en Belgische expats in Pinoso
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Ik zoek hulp
            </button>
            <button className="bg-accent-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-accent-700 transition-colors">
              Ik bied hulp aan
            </button>
          </div>
        </div>
      </section>
    </div>
  );
} 
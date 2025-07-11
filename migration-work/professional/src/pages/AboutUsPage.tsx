import React from 'react';
import { Link } from 'react-router-dom';
import { User, Users, Building, Heart, Star, Calendar, MapPin, Shield, ArrowRight } from 'lucide-react';

export function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Over Ons
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Leer meer over Care & Service Pinoso, onze missie en de mensen achter onze diensten
          </p>
        </div>
      </div>

      {/* About the Company Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-600 mb-4">Care & Service Pinoso - Jouw Betrouwbare Partner in Spanje</h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-primary-600 mb-6">Welkom in Onze Gemeenschap</h3>
              <div className="prose prose-lg text-text-secondary">
                <p>
                  Wanneer je de stap zet om je leven op te bouwen in het prachtige Pinoso, kom je terecht in een wereld vol nieuwe mogelijkheden. Maar laten we eerlijk zijn - het brengt ook uitdagingen met zich mee die alleen iemand die het zelf heeft meegemaakt echt begrijpt. Van het navigeren door Spaanse bureaucratie tot het vinden van betrouwbare hulp bij dagelijkse zaken, van taalbarrières bij medische afspraken tot het zorgen voor je huis tijdens een bezoek aan het thuisland.
                </p>
                <p>
                  Bij Care & Service Pinoso begrijpen we deze uitdagingen, omdat wij ze zelf hebben ervaren. Wij zijn niet zomaar een servicebedrijf - we zijn een gemeenschap van Nederlandse en Belgische immigranten en expats die elkaar helpen om het leven in Spanje niet alleen makkelijker, maar ook veel leuker te maken.
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              {/* Placeholder for image */}
              <div className="bg-gray-200 h-64 rounded-xl flex items-center justify-center">
                <Building className="w-16 h-16 text-gray-400" />
                <span className="ml-2 text-gray-500">Bedrijfsfoto</span>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h3 className="text-2xl font-bold text-primary-600 mb-6 text-center">Meer Dan Alleen Service</h3>
            <div className="prose prose-lg text-text-secondary max-w-4xl mx-auto">
              <p>
                Met meer dan 10 jaar ervaring en een netwerk van 100+ tevreden klanten hebben we bewezen dat ondersteuning door mensen die jouw situatie begrijpen het verschil maakt. Onze 98% tevredenheidsscore spreekt boekdelen, maar wat ons echt trots maakt zijn de verhalen van onze klanten - zoals Jan en Annemieke die eindelijk hun administratie op orde hebben, of Klaas die zich veilig voelde toen hij medische hulp nodig had.
              </p>
            </div>
          </div>

          {/* Services Overview */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-primary-600 mb-8 text-center">Onze Diensten, Jouw Gemoedsrust</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-primary-600" />
                </div>
                <h4 className="text-lg font-bold text-primary-600 mb-2">Huishoudelijke Ondersteuning</h4>
                <p className="text-text-secondary">
                  Van wekelijkse schoonmaak tot wasservice - wij zorgen ervoor dat je huis een thuis blijft, zodat jij kunt genieten van het Spaanse leven.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-primary-600" />
                </div>
                <h4 className="text-lg font-bold text-primary-600 mb-2">Zorg & Begeleiding</h4>
                <p className="text-text-secondary">
                  Ouderenzorg, vervoer naar medische afspraken, en persoonlijke begeleiding. Want iedereen verdient zorg in zijn eigen taal en met begrip voor zijn achtergrond.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <h4 className="text-lg font-bold text-primary-600 mb-2">Huis- & Huisdierenoppas</h4>
                <p className="text-text-secondary">
                  Ga met een gerust hart op reis naar familie en vrienden. Wij zorgen voor je huis en je geliefde huisdieren alsof het onze eigen zijn.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary-600" />
                </div>
                <h4 className="text-lg font-bold text-primary-600 mb-2">Technische & Praktische Hulp</h4>
                <p className="text-text-secondary">
                  Van kleine reparaties tot hulp bij administratie - wij lossen het op, zodat jij je kunt focussen op wat echt belangrijk is.
                </p>
              </div>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-primary-600 mb-8 text-center">Waarom Kiezen Voor Ons?</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-primary-600 mb-2">Flexibiliteit die Past bij Jouw Leven</h4>
                  <p className="text-text-secondary">
                    Of je nu eenmalige hulp nodig hebt of regelmatige ondersteuning zoekt, wij plannen wanneer het jou uitkomt. Geen starre schema's, maar maatwerk dat aansluit bij jouw ritme.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Euro className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-primary-600 mb-2">Transparantie in Alles</h4>
                  <p className="text-text-secondary">
                    Eerlijke prijzen zonder verborgen kosten. Wat we afspreken, daar kun je op rekenen. Onze abonnementen, kortingen en servicebundels zijn ontworpen om je te laten besparen, niet om je te verwarren.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-primary-600 mb-2">Persoonlijke Benadering</h4>
                  <p className="text-text-secondary">
                    Elke situatie is uniek, net als elke persoon. We luisteren naar jouw specifieke behoeften en wensen, en passen onze service daarop aan. Want standaardoplossingen bestaan niet als het om mensen gaat.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-primary-600 mb-2">100% Betrouwbaarheid</h4>
                  <p className="text-text-secondary">
                    In meer dan 10 jaar hebben we deze belofte waargemaakt. Onze klanten vertrouwen ons hun huis, hun huisdieren, en vaak hun meest kwetsbare momenten toe. Die verantwoordelijkheid nemen we niet licht op.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Together Stronger */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-primary-600 mb-6 text-center">Samen Sterker</h3>
            <div className="prose prose-lg text-text-secondary max-w-4xl mx-auto">
              <p>
                Care & Service Pinoso is ontstaan uit de overtuiging dat niemand de uitdagingen van het immigranten- en expatleven alleen hoeft aan te gaan. We zijn een brug tussen mensen die hulp nodig hebben en mensen die graag willen helpen. Een netwerk waar Nederlandse en Belgische waarden als betrouwbaarheid, directheid en zorgzaamheid centraal staan.
              </p>
              <p>
                Of je nu net bent aangekomen in Pinoso of al jaren hier woont, of je nu hulp zoekt of juist je diensten wilt aanbieden - bij ons ben je welkom. Want samen maken we het leven hier niet alleen makkelijker, maar ook veel gezelliger.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-primary-600 mb-6">Klaar Voor de Volgende Stap?</h3>
            <p className="text-lg text-text-secondary mb-8 max-w-3xl mx-auto">
              Sluit je aan bij onze groeiende gemeenschap van tevreden klanten en serviceverleners. Ontdek hoe fijn het is om ondersteuning te hebben van mensen die jouw taal spreken en jouw situatie begrijpen.
            </p>
            <p className="text-lg font-bold text-primary-600 mb-8">
              Want in Pinoso hebben we elkaar - en dat maakt alle verschil.
            </p>
            <Link 
              href="/signup"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors inline-flex items-center space-x-2"
            >
              <span>Word onderdeel van onze gemeenschap</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* About the Founder Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-600 mb-4">Over Henk Siereveld</h2>
            <p className="text-xl text-text-secondary">Oprichter & Eigenaar Care & Service Pinoso</p>
            <div className="w-24 h-1 bg-primary-500 mx-auto mt-4"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              {/* Placeholder for founder image */}
              <div className="bg-gray-200 h-80 rounded-xl flex items-center justify-center">
                <User className="w-16 h-16 text-gray-400" />
                <span className="ml-2 text-gray-500">Foto van Henk Siereveld</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-primary-600 mb-6">Mijn Verhaal</h3>
              <div className="prose prose-lg text-text-secondary">
                <p>
                  Hallo, ik ben Henk Siereveld, de oprichter en eigenaar van Care & Service Pinoso. Net als velen van jullie heb ik de stap genomen om een nieuw leven op te bouwen in het prachtige Pinoso, Spanje. Vanuit mijn achtergrond als ondernemer, adviseur en verbinder weet ik hoe belangrijk het is dat mensen zich gehoord, veilig en ondersteund voelen - een principe dat ik nu toepas in onze immigranten- en expat-gemeenschap.
                </p>
                
                <h4 className="text-xl font-bold text-primary-600 mt-6 mb-3">Waarom Care & Service?</h4>
                <p>
                  De overgang naar een nieuw land brengt uitdagingen met zich mee die alleen iemand die het zelf heeft meegemaakt echt begrijpt. Van het navigeren door de Spaanse bureaucratie tot het vinden van betrouwbare hulp bij dagelijkse zaken - ik heb het allemaal ervaren. Deze persoonlijke ervaring vormde de basis voor Care & Service Pinoso.
                </p>
                <p>
                  Met meer dan 10 jaar ervaring in het helpen van mensen en een netwerk van meer dan 1000 connecties, combineer ik mijn professionele achtergrond met een aardig diep begrip van wat onze gemeenschap nodig heeft.
                </p>
                
                <h4 className="text-xl font-bold text-primary-600 mt-6 mb-3">Mijn Missie</h4>
                <p>
                  Ik geloof dat niemand de uitdagingen van het immigranen- en expat-leven alleen hoeft aan te gaan. Daarom heb ik Care & Service opgericht: om een brug te slaan tussen mensen die hulp nodig hebben en mensen die graag willen helpen. We zijn meer dan een servicebedrijf - we zijn een gemeenschap.
                </p>
                
                <h4 className="text-xl font-bold text-primary-600 mt-6 mb-3">Persoonlijke Touch</h4>
                <p>
                  Wanneer ik niet bezig ben met het runnen van Care & Service of mijn andere ondernemersactiviteiten, vind je me waarschijnlijk, samen met mijn vrouw Marian, op een van de lokale terrasjes in Pinoso, genietend van een cortado en pratend met andere Nederlanders, Belgen, Engelsen of wie dan ook over hun ervaringen. Ik ben ervan overtuigd dat de beste oplossingen ontstaan uit echte gesprekken en wederzijds begrip.
                </p>
              </div>
              
              <div className="mt-8">
                <h4 className="text-xl font-bold text-primary-600 mb-4">Wat Me Drijft</h4>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-primary-600" />
                    </div>
                    <span className="text-text-secondary">Gemeenschapsgevoel: Samen zijn we sterker dan alleen</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                      <Shield className="w-3 h-3 text-primary-600" />
                    </div>
                    <span className="text-text-secondary">Betrouwbaarheid: Doen wat je belooft, altijd</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-primary-600" />
                    </div>
                    <span className="text-text-secondary">Persoonlijke benadering: Elke situatie is uniek en verdient maatwerk</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-primary-600" />
                    </div>
                    <span className="text-text-secondary">Transparantie: Eerlijke communicatie en faire prijzen</span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-8 p-6 bg-primary-100 rounded-xl">
                <h4 className="text-xl font-bold text-primary-600 mb-3">Contact</h4>
                <p className="text-text-secondary mb-4">
                  Of je nu hulp nodig hebt of juist je diensten wilt aanbieden, ik sta altijd open voor een gesprek. Laten we samen het leven in Pinoso nog mooier maken voor onze Nederlandse en Belgische gemeenschap.
                </p>
                <p className="text-primary-600 font-bold italic">
                  "In Pinoso hebben we elkaar - en dat maakt alle verschil."
                </p>
                <div className="mt-4 flex items-center">
                  <div className="font-bold text-primary-600">Henk Siereveld</div>
                  <div className="mx-2 text-primary-300">|</div>
                  <div className="text-text-secondary">Oprichter & Eigenaar</div>
                </div>
                <div className="mt-1 text-text-secondary text-sm">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    El Pinós / Pinoso, Valencian Community
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-600 mb-4">Ons Team</h2>
            <p className="text-xl text-text-secondary">De mensen achter Care & Service Pinoso</p>
            <div className="w-24 h-1 bg-primary-500 mx-auto mt-4"></div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-primary-600 mb-4">Team in Opbouw</h3>
              <p className="text-lg text-text-secondary max-w-3xl mx-auto">
                Ons team is momenteel in opbouw. We zijn op zoek naar enthousiaste professionals die onze gemeenschap willen versterken en ondersteunen.
              </p>
            </div>

            <div className="bg-primary-50 rounded-xl p-6">
              <h4 className="text-xl font-bold text-primary-600 mb-4 text-center">Word Onderdeel van Ons Team</h4>
              <p className="text-text-secondary mb-6 text-center">
                Ben jij een betrouwbare professional die graag anderen helpt? Spreek je Nederlands of Vlaams en woon je in de regio Pinoso? Dan zijn we op zoek naar jou!
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                    <Heart className="w-5 h-5 text-primary-600" />
                  </div>
                  <h5 className="font-bold text-primary-600 mb-2">Zorgprofessionals</h5>
                  <p className="text-sm text-text-secondary">
                    Voor persoonlijke zorg, ouderenbegeleiding en medische ondersteuning
                  </p>
                </div>
                
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                    <Home className="w-5 h-5 text-primary-600" />
                  </div>
                  <h5 className="font-bold text-primary-600 mb-2">Huishoudelijke Hulp</h5>
                  <p className="text-sm text-text-secondary">
                    Voor schoonmaak, wasservice en algemeen huishoudelijk werk
                  </p>
                </div>
                
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                    <Wrench className="w-5 h-5 text-primary-600" />
                  </div>
                  <h5 className="font-bold text-primary-600 mb-2">Technische Experts</h5>
                  <p className="text-sm text-text-secondary">
                    Voor reparaties, onderhoud en technische ondersteuning
                  </p>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Link 
                  href="/service-provider-application"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                >
                  <span>Solliciteer als Service Professional</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Klaar om deel te worden van onze gemeenschap?
          </h2>
          <p className="text-xl text-primary-100 mb-8 leading-relaxed">
            Of je nu op zoek bent naar betrouwbare diensten of je eigen expertise wilt aanbieden, 
            bij Care & Service Pinoso ben je welkom.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup"
              className="bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
            >
              Word klant
            </Link>
            <Link 
              href="/service-provider-application"
              className="bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-primary-800 transition-colors inline-flex items-center justify-center border border-primary-500"
            >
              Word service professional
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import the missing Euro and Wrench icons
function Euro(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10h12" />
      <path d="M4 14h9" />
      <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" />
    </svg>
  );
}

function Wrench(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function Home(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
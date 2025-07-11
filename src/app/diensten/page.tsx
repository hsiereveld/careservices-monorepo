"use client";
import Link from "next/link";
import { Home as HomeIcon, Car, Heart, ShoppingCart, FileText, Phone, Clock, Users, Star } from "lucide-react";
import Header from "../components/Header";
import FooterSection from "../components/FooterSection";

export default function DienstenPage() {
  const serviceCategories = [
    {
      id: 'medische-begeleiding',
      title: 'Medische Begeleiding',
      description: 'Professionele ondersteuning bij medische zaken en ziekenhuisbezoeken',
      icon: '🏥',
      services: [
        {
          name: 'Vervoer naar ziekenhuis of doktersafspraak',
          price: '€0.29 per km',
          duration: '60 minuten',
          description: 'Betrouwbaar vervoer naar medische afspraken',
          isHighlighted: true
        },
        {
          name: 'Medische Begeleiding',
          price: 'Gratis kennismaking',
          duration: '60 minuten',
          description: 'Ondersteuning bij medische gesprekken en procedures'
        },
        {
          name: 'Begeleiding ziekenhuis',
          price: '€15.00 per uur',
          duration: '60 minuten',
          description: 'Persoonlijke begeleiding tijdens ziekenhuisbezoeken'
        },
        {
          name: 'Fysiotherapie thuis',
          price: '€53.50 per uur',
          duration: '60 minuten',
          description: 'Professionele fysiotherapie in je eigen huis'
        }
      ]
    },
    {
      id: 'oppas-diensten',
      title: 'Oppas Diensten',
      description: 'Betrouwbare zorg voor kinderen, senioren en huisdieren',
      icon: '👶',
      services: [
        {
          name: 'Huisoppas',
          price: '€45.99 per dag',
          duration: '600 minuten',
          description: 'Volledige zorg voor je huis tijdens afwezigheid'
        },
        {
          name: 'Huisdieroppas',
          price: '€13.00 per uur',
          duration: '60 minuten',
          description: 'Liefdevolle zorg voor je huisdieren'
        },
        {
          name: 'Ouderenzorg Services',
          price: 'Gratis kennismaking',
          duration: 'Flexibel',
          description: 'Gezelschap en ondersteuning voor senioren',
          isHighlighted: true
        },
        {
          name: 'Kinderopvang',
          price: '€16.50 per uur',
          duration: '60 minuten',
          description: 'Professionele kinderopvang in vertrouwde omgeving'
        }
      ]
    },
    {
      id: 'huishouden',
      title: 'Huishouden',
      description: 'Complete huishoudelijke ondersteuning',
      icon: '🏠',
      services: [
        {
          name: 'Huishoudelijke Hulp plus',
          price: '€13.50 per uur',
          duration: '60 minuten',
          description: 'Uitgebreide huishoudelijke ondersteuning'
        },
        {
          name: 'Schoonmaak',
          price: '€15.00 per uur',
          duration: '60 minuten',
          description: 'Professionele schoonmaak van je woning'
        },
        {
          name: 'Tuinonderhoud',
          price: '€17.00 per uur',
          duration: '60 minuten',
          description: 'Onderhoud van tuin en buitenruimtes'
        },
        {
          name: 'Boodschappen service',
          price: '€14.00 per uur',
          duration: '60 minuten',
          description: 'Boodschappen doen en bezorgen'
        }
      ]
    },
    {
      id: 'technische-hulp',
      title: 'Technische Hulp',
      description: 'Vakkundige reparaties en onderhoud',
      icon: '🔧',
      services: [
        {
          name: 'Klusjesman algemeen',
          price: '€21.50 per uur',
          duration: '60 minuten',
          description: 'Algemene klussen en reparaties'
        },
        {
          name: 'Schilder',
          price: '€25.00 per uur',
          duration: '60 minuten',
          description: 'Professioneel schilderwerk binnen en buiten'
        },
        {
          name: 'Loodgieter',
          price: '€36.00 per uur',
          duration: '60 minuten',
          description: 'Loodgieterwerk en sanitair reparaties'
        },
        {
          name: 'Elektricien',
          price: '€38.00 per uur',
          duration: '60 minuten',
          description: 'Elektrische installaties en reparaties'
        },
        {
          name: 'Airco technicus',
          price: '€40.50 per uur',
          duration: '60 minuten',
          description: 'Onderhoud en reparatie van airconditioners'
        }
      ]
    },
    {
      id: 'administratieve-ondersteuning',
      title: 'Administratieve Ondersteuning',
      description: 'Hulp bij Spaanse bureaucratie en papierwerk',
      icon: '📋',
      services: [
        {
          name: 'Administratieve Ondersteuning',
          price: '€20.87 per uur',
          duration: '60 minuten',
          description: 'Algemene hulp bij Spaanse administratie'
        },
        {
          name: 'NIE nummer aanvraag',
          price: '€30.25 per uur',
          duration: '60 minuten',
          description: 'Ondersteuning bij NIE nummer aanvraag'
        },
        {
          name: 'Empadronamiento',
          price: '€21.78 per uur',
          duration: '60 minuten',
          description: 'Hulp bij inschrijving bij gemeente'
        },
        {
          name: 'Bankzaken regelen',
          price: '€24.20 per uur',
          duration: '60 minuten',
          description: 'Ondersteuning bij het openen van bankrekening'
        },
        {
          name: 'Verzekeringen afsluiten',
          price: '€33.88 per uur',
          duration: '60 minuten',
          description: 'Hulp bij het afsluiten van verzekeringen'
        },
        {
          name: 'Belasting aangifte',
          price: '€48.40 per uur',
          duration: '60 minuten',
          description: 'Professionele hulp bij belasting aangifte'
        }
      ]
    },
    {
      id: 'property-management',
      title: 'Property Management',
      description: 'Beheer van tweede woningen en verhuur',
      icon: '🏘️',
      services: [
        {
          name: 'Woningbeheer',
          price: '€21.75 per uur',
          duration: '60 minuten',
          description: 'Volledig beheer van je eigendom'
        },
        {
          name: 'Sleutelbeheer',
          price: '€16.75 per uur',
          duration: '60 minuten',
          description: 'Veilig beheer van sleutels en toegang'
        },
        {
          name: 'Pool onderhoud',
          price: '€24.50 per uur',
          duration: '60 minuten',
          description: 'Professioneel zwembadonderhoud'
        }
      ]
    },
    {
      id: 'vervoer',
      title: 'Vervoer',
      description: 'Betrouwbaar vervoer voor alle gelegenheden',
      icon: '🚗',
      services: [
        {
          name: 'Chauffeur',
          price: '€17.00 per uur',
          duration: '60 minuten',
          description: 'Persoonlijke chauffeurservice'
        },
        {
          name: 'Luchthaven transfer',
          price: '€60.50 per rit',
          duration: '120 minuten',
          description: 'Comfortabel vervoer naar/van luchthaven'
        },
        {
          name: 'Verhuisservice',
          price: '€25.00 per uur',
          duration: '60 minuten',
          description: 'Professionele verhuishulp'
        },
        {
          name: 'Meubel transport',
          price: '€25.00 per uur',
          duration: '60 minuten',
          description: 'Veilig transport van meubels'
        }
      ]
    },
    {
      id: 'sociale-activiteiten',
      title: 'Sociale Activiteiten',
      description: 'Gezelschap en begeleiding bij activiteiten',
      icon: '👥',
      services: [
        {
          name: 'Gezelschap senioren',
          price: '€15.75 per uur',
          duration: '60 minuten',
          description: 'Sociale contacten en gezelschap'
        },
        {
          name: 'Begeleiding activiteiten',
          price: '€17.00 per uur',
          duration: '60 minuten',
          description: 'Begeleiding bij uitjes en activiteiten'
        },
        {
          name: 'Taalondersteuning',
          price: '€25.00 per uur',
          duration: '60 minuten',
          description: 'Hulp bij het leren van Spaans',
          isHighlighted: true
        }
      ]
    },
    {
      id: 'zwembad-techniek',
      title: 'Zwembad Techniek',
      description: 'Specialistische zwembadonderhoud en reparaties',
      icon: '🏊',
      services: [
        {
          name: 'Zwembad onderhoud',
          price: '€30.00 per uur',
          duration: '60 minuten',
          description: 'Regulier onderhoud van zwembaden',
          isHighlighted: true
        },
        {
          name: 'Zwembad reparatie',
          price: '€32.00 per uur',
          duration: '60 minuten',
          description: 'Reparaties aan zwembadinstallaties'
        },
        {
          name: 'Zwembad chemie',
          price: '€20.00 per uur',
          duration: '60 minuten',
          description: 'Chemische balans en waterkwaliteit'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Header */}
      <div className="bg-primary-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Onze Diensten
          </h1>
          <p className="text-xl text-center text-primary-100 max-w-3xl mx-auto">
            Ontdek ons complete aanbod van 37 verschillende services voor Nederlandse en Belgische expats in Pinoso
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-16">
          {serviceCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Category Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{category.icon}</div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{category.title}</h2>
                    <p className="text-primary-100 text-lg">{category.description}</p>
                  </div>
                </div>
              </div>

              {/* Services List */}
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {category.services.map((service, index) => (
                    <div
                      key={index}
                      className={`relative p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                        service.isHighlighted
                          ? 'border-accent-400 bg-accent-50'
                          : 'border-gray-200 bg-white hover:border-primary-300'
                      }`}
                    >
                      {service.isHighlighted && (
                        <div className="absolute -top-2 -right-2 bg-accent-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Uitgelicht
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary-600">{service.price}</div>
                          <div className="text-sm text-gray-500">{service.duration}</div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{service.description}</p>
                      
                      <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold">
                        Boek Nu
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Note */}
      <div className="bg-primary-50 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center text-primary-600 mb-6">
              Transparante Prijzen
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-primary-600 font-bold text-lg mb-2">Geen Verborgen Kosten</div>
                <p className="text-gray-600">Alle prijzen zijn inclusief BTW en duidelijk vermeld</p>
              </div>
              <div>
                <div className="text-primary-600 font-bold text-lg mb-2">Flexibele Planning</div>
                <p className="text-gray-600">Boek eenmalig of regelmatig, geheel naar uw wensen</p>
              </div>
              <div>
                <div className="text-primary-600 font-bold text-lg mb-2">Kwaliteitsgarantie</div>
                <p className="text-gray-600">100% tevredenheidsgarantie op alle uitgevoerde diensten</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Niet gevonden wat je zoekt?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            We zijn altijd bereid om maatwerkoplossingen te bedenken. 
            Neem contact op en vertel ons wat je nodig hebt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
              Neem Contact Op
            </button>
            <button className="border-2 border-gray-600 text-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
              Word Professional
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
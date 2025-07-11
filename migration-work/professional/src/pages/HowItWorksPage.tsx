import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Check, 
  User, 
  Users, 
  Calendar, 
  Star, 
  MessageSquare, 
  Search, 
  Briefcase, 
  Euro, 
  Clock, 
  Shield, 
  Heart, 
  Settings, 
  CheckCircle,
  Percent,
  FileText,
  MapPin,
  Phone,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function HowItWorksPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'clients' | 'professionals'>('clients');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Hoe Werkt Het?
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Ontdek hoe Care & Service Pinoso werkt voor klanten en professionals
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl p-2 shadow-lg border border-primary-200/50 mb-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'clients'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-primary-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Voor Klanten</span>
            </button>
            <button
              onClick={() => setActiveTab('professionals')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'professionals'
                  ? 'bg-accent-500 text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-accent-50'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Voor Professionals</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-12">
          {/* For Clients */}
          {activeTab === 'clients' && (
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-primary-600 mb-4">Voor Klanten</h2>
                <p className="text-lg text-text-secondary max-w-3xl mx-auto">
                  Ontdek hoe je eenvoudig betrouwbare diensten kunt vinden en boeken via Care & Service Pinoso
                </p>
              </div>

              {/* Step 1: Create Account */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-primary-200/50 mb-8">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 text-xl font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary-600 mb-4">Maak een account aan</h3>
                    <p className="text-text-secondary mb-6">
                      Begin met het aanmaken van een gratis account. Selecteer "Ik zoek hulp" tijdens het registratieproces om een klantaccount aan te maken.
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-primary-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <h4 className="font-semibold text-primary-700 mb-2">Persoonlijk profiel</h4>
                        <p className="text-sm text-primary-600">
                          Vul je persoonlijke gegevens in zodat professionals je beter kunnen helpen
                        </p>
                      </div>
                      
                      <div className="bg-primary-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                          <Shield className="w-5 h-5 text-primary-600" />
                        </div>
                        <h4 className="font-semibold text-primary-700 mb-2">Veilig & vertrouwd</h4>
                        <p className="text-sm text-primary-600">
                          Je gegevens worden veilig bewaard en alleen gedeeld met professionals die je helpen
                        </p>
                      </div>
                      
                      <div className="bg-primary-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                          <CheckCircle className="w-5 h-5 text-primary-600" />
                        </div>
                        <h4 className="font-semibold text-primary-700 mb-2">Eenvoudig proces</h4>
                        <p className="text-sm text-primary-600">
                          Registreren duurt slechts enkele minuten en je kunt direct beginnen
                        </p>
                      </div>
                    </div>
                    
                    {!user && (
                      <div className="mt-6">
                        <Link 
                          href="/signup"
                          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
                        >
                          <User className="w-5 h-5" />
                          <span>Account aanmaken</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Find Services */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-primary-200/50 mb-8">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 text-xl font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary-600 mb-4">Zoek de juiste dienst</h3>
                    <p className="text-text-secondary mb-6">
                      Blader door onze categorieën of gebruik de zoekfunctie om de dienst te vinden die je nodig hebt. 
                      Filter op categorie, prijs of beschikbaarheid.
                    </p>
                    
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                      <h4 className="font-semibold text-text-primary mb-4">Beschikbare categorieën</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4 text-primary-600" />
                          <span className="text-text-secondary">Persoonlijke Zorg</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-primary-600" />
                          <span className="text-text-secondary">Transport & Begeleiding</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-primary-600" />
                          <span className="text-text-secondary">Administratieve Hulp</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <HomeIcon className="w-4 h-4 text-primary-600" />
                          <span className="text-text-secondary">Huishoudelijke Hulp</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-primary-600" />
                          <span className="text-text-secondary">Huisdierenzorg</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Settings className="w-4 h-4 text-primary-600" />
                          <span className="text-text-secondary">Technische Hulp</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 bg-primary-50 rounded-xl p-4">
                        <h4 className="font-semibold text-primary-700 mb-2 flex items-center space-x-2">
                          <Search className="w-4 h-4" />
                          <span>Zoek op trefwoord</span>
                        </h4>
                        <p className="text-sm text-primary-600">
                          Zoek op trefwoorden zoals "schoonmaak", "vervoer" of "administratie"
                        </p>
                      </div>
                      
                      <div className="flex-1 bg-primary-50 rounded-xl p-4">
                        <h4 className="font-semibold text-primary-700 mb-2 flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>Bekijk beoordelingen</span>
                        </h4>
                        <p className="text-sm text-primary-600">
                          Lees beoordelingen van andere klanten om de beste professional te vinden
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <Link 
                        href="/diensten"
                        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
                      >
                        <Search className="w-5 h-5" />
                        <span>Bekijk alle diensten</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Book Service */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-primary-200/50 mb-8">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 text-xl font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary-600 mb-4">Boek je dienst</h3>
                    <p className="text-text-secondary mb-6">
                      Selecteer een dienst en professional, kies een datum en tijd die voor jou werkt, en vul je adres en contactgegevens in.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-primary-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                          <Calendar className="w-5 h-5 text-primary-600" />
                        </div>
                        <h4 className="font-semibold text-primary-700 mb-2">Kies datum en tijd</h4>
                        <p className="text-sm text-primary-600">
                          Selecteer een datum en tijd die voor jou werkt uit de beschikbare opties
                        </p>
                      </div>
                      
                      <div className="bg-primary-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                          <Clock className="w-5 h-5 text-primary-600" />
                        </div>
                        <h4 className="font-semibold text-primary-700 mb-2">Geef details door</h4>
                        <p className="text-sm text-primary-600">
                          Vul je adres, telefoonnummer en eventuele speciale wensen in
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-xl p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-800 mb-2">Prijzen en betalingen</h4>
                          <p className="text-sm text-blue-700">
                            Alle prijzen zijn inclusief BTW en worden duidelijk weergegeven voordat je boekt. 
                            Je betaalt pas nadat de professional je boeking heeft bevestigd.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Bevestiging</span>
                      </h4>
                      <p className="text-sm text-green-700 mb-2">
                        Na het boeken ontvang je een bevestigingsmail met alle details. De professional zal contact met je opnemen om eventuele details te bespreken.
                      </p>
                      <p className="text-sm text-green-700">
                        Je kunt je boeking altijd bekijken en beheren in je dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Manage Bookings */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-primary-200/50 mb-8">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 text-xl font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary-600 mb-4">Beheer je boekingen</h3>
                    <p className="text-text-secondary mb-6">
                      In je persoonlijke dashboard kun je al je boekingen bekijken, wijzigen of annuleren. 
                      Je kunt ook je facturen inzien en betalingen beheren.
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-primary-50 rounded-xl p-4">
                        <h4 className="font-semibold text-primary-700 mb-2">Aankomende boekingen</h4>
                        <p className="text-sm text-primary-600">
                          Bekijk al je geplande afspraken in één overzicht
                        </p>
                      </div>
                      
                      <div className="bg-primary-50 rounded-xl p-4">
                        <h4 className="font-semibold text-primary-700 mb-2">Facturen</h4>
                        <p className="text-sm text-primary-600">
                          Bekijk en download al je facturen
                        </p>
                      </div>
                      
                      <div className="bg-primary-50 rounded-xl p-4">
                        <h4 className="font-semibold text-primary-700 mb-2">Beoordelingen</h4>
                        <p className="text-sm text-primary-600">
                          Laat een beoordeling achter na afloop van een dienst
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">Annuleringsbeleid</h4>
                      <p className="text-sm text-yellow-700">
                        Je kunt een boeking tot 24 uur van tevoren kosteloos annuleren. Bij latere annulering kunnen kosten in rekening worden gebracht.
                      </p>
                    </div>
                    
                    {user && (
                      <div className="mt-6">
                        <Link 
                          href="/client-dashboard"
                          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
                        >
                          <User className="w-5 h-5" />
                          <span>Naar mijn dashboard</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 5: Leave Reviews */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-primary-200/50">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 text-xl font-bold">5</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary-600 mb-4">Laat een beoordeling achter</h3>
                    <p className="text-text-secondary mb-6">
                      Na afloop van een dienst kun je een beoordeling achterlaten. Dit helpt andere klanten bij het kiezen van een professional 
                      en geeft professionals waardevolle feedback.
                    </p>
                    
                    <div className="bg-primary-50 rounded-xl p-6 mb-6">
                      <h4 className="font-semibold text-primary-700 mb-4">Hoe werkt beoordelen?</h4>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium flex-shrink-0">1</div>
                          <div>
                            <p className="text-primary-700">Ga naar je dashboard en selecteer de voltooide boeking</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium flex-shrink-0">2</div>
                          <div>
                            <p className="text-primary-700">Klik op "Beoordeling toevoegen" en geef een score van 1-5 sterren</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium flex-shrink-0">3</div>
                          <div>
                            <p className="text-primary-700">Schrijf een korte recensie over je ervaring</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium flex-shrink-0">4</div>
                          <div>
                            <p className="text-primary-700">Verzend je beoordeling en help anderen bij het maken van een keuze</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <h4 className="font-semibold text-green-800">Waarom beoordelen belangrijk is</h4>
                      </div>
                      <p className="text-sm text-green-700">
                        Beoordelingen helpen ons om de kwaliteit van onze diensten te verbeteren en zorgen ervoor dat andere klanten 
                        de beste professionals kunnen vinden. Het kost slechts een minuut, maar maakt een groot verschil!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* For Professionals */}
          {activeTab === 'professionals' && (
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-accent-600 mb-4">Voor Professionals</h2>
                <p className="text-lg text-text-secondary max-w-3xl mx-auto">
                  Ontdek hoe je als professional diensten kunt aanbieden en klanten kunt helpen via Care & Service Pinoso
                </p>
              </div>

              {/* Step 1: Create Account */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-accent-200/50 mb-8">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-600 text-xl font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-accent-600 mb-4">Maak een professional account aan</h3>
                    <p className="text-text-secondary mb-6">
                      Begin met het aanmaken van een gratis account. Selecteer "Ik bied hulp aan" tijdens het registratieproces om een professional account aan te maken.
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-accent-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
                          <Briefcase className="w-5 h-5 text-accent-600" />
                        </div>
                        <h4 className="font-semibold text-accent-700 mb-2">Professional profiel</h4>
                        <p className="text-sm text-accent-600">
                          Vul je professionele gegevens in zodat klanten je kunnen vinden
                        </p>
                      </div>
                      
                      <div className="bg-accent-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
                          <Shield className="w-5 h-5 text-accent-600" />
                        </div>
                        <h4 className="font-semibold text-accent-700 mb-2">Verificatie</h4>
                        <p className="text-sm text-accent-600">
                          Doorloop het verificatieproces om het vertrouwen van klanten te winnen
                        </p>
                      </div>
                      
                      <div className="bg-accent-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
                          <CheckCircle className="w-5 h-5 text-accent-600" />
                        </div>
                        <h4 className="font-semibold text-accent-700 mb-2">Eenvoudig proces</h4>
                        <p className="text-sm text-accent-600">
                          Registreren duurt slechts enkele minuten en je kunt direct beginnen
                        </p>
                      </div>
                    </div>
                    
                    {!user && (
                      <div className="mt-6">
                        <Link 
                          href="/signup"
                          className="bg-accent-600 hover:bg-accent-700 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
                        >
                          <Briefcase className="w-5 h-5" />
                          <span>Professional account aanmaken</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Set Up Services */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-accent-200/50 mb-8">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-600 text-xl font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-accent-600 mb-4">Stel je diensten in</h3>
                    <p className="text-text-secondary mb-6">
                      Configureer welke diensten je wilt aanbieden, stel je prijzen in en voeg details toe over je expertise.
                    </p>
                    
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                      <h4 className="font-semibold text-text-primary mb-4">Het prijsmodel</h4>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-medium flex-shrink-0">1</div>
                          <div>
                            <p className="font-medium text-text-primary">Jouw prijs (wat jij ontvangt)</p>
                            <p className="text-text-secondary text-sm">
                              Dit is het bedrag dat jij ontvangt per eenheid (uur, km, etc.)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-medium flex-shrink-0">2</div>
                          <div>
                            <p className="font-medium text-text-primary">Commissie (voor het platform)</p>
                            <p className="text-text-secondary text-sm">
                              Een percentage dat Care & Service rekent voor het platform. Dit is standaard 15%, maar kan variëren per categorie.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-medium flex-shrink-0">3</div>
                          <div>
                            <p className="font-medium text-text-primary">BTW (21%)</p>
                            <p className="text-text-secondary text-sm">
                              BTW wordt berekend over de som van jouw prijs en de commissie
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-medium flex-shrink-0">4</div>
                          <div>
                            <p className="font-medium text-text-primary">Verkoopprijs (wat de klant betaalt)</p>
                            <p className="text-text-secondary text-sm">
                              De totale prijs die de klant betaalt, inclusief jouw prijs, commissie en BTW
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-accent-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
                          <Euro className="w-5 h-5 text-accent-600" />
                        </div>
                        <h4 className="font-semibold text-accent-700 mb-2">Prijzen instellen</h4>
                        <p className="text-sm text-accent-600">
                          Stel je eigen prijzen in voor elke dienst die je aanbiedt. Je kunt kiezen uit verschillende prijseenheden zoals per uur, per dag of per service.
                        </p>
                      </div>
                      
                      <div className="bg-accent-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
                          <Percent className="w-5 h-5 text-accent-600" />
                        </div>
                        <h4 className="font-semibold text-accent-700 mb-2">Commissie structuur</h4>
                        <p className="text-sm text-accent-600">
                          De standaard commissie is 15%, maar dit kan variëren per categorie. Je kunt ook een aangepaste commissie voorstellen die door een administrator moet worden goedgekeurd.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-800 mb-2">Voorbeeld berekening</h4>
                          <p className="text-sm text-blue-700 mb-2">
                            Als je een uurtarief van €70 instelt met een commissie van 15%:
                          </p>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Jouw prijs: €70,00</li>
                            <li>• Commissie: €10,50 (15% van €70)</li>
                            <li>• Netto prijs: €80,50 (jouw prijs + commissie)</li>
                            <li>• BTW: €16,91 (21% van €80,50)</li>
                            <li>• Verkoopprijs: €97,41 (wat de klant betaalt)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Set Availability */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-accent-200/50 mb-8">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-600 text-xl font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-accent-600 mb-4">Stel je beschikbaarheid in</h3>
                    <p className="text-text-secondary mb-6">
                      Geef aan wanneer je beschikbaar bent voor boekingen. Klanten kunnen alleen boeken op tijden dat je beschikbaar bent.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-accent-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
                          <Calendar className="w-5 h-5 text-accent-600" />
                        </div>
                        <h4 className="font-semibold text-accent-700 mb-2">Algemene beschikbaarheid</h4>
                        <p className="text-sm text-accent-600">
                          Stel je standaard beschikbaarheid in per dag van de week en tijdslot (ochtend, middag, avond)
                        </p>
                      </div>
                      
                      <div className="bg-accent-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
                          <Clock className="w-5 h-5 text-accent-600" />
                        </div>
                        <h4 className="font-semibold text-accent-700 mb-2">Specifieke uitzonderingen</h4>
                        <p className="text-sm text-accent-600">
                          Blokkeer specifieke datums of periodes voor vakanties of andere verplichtingen
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">Belangrijk</h4>
                      <p className="text-sm text-yellow-700">
                        Houd je beschikbaarheid altijd up-to-date om teleurstellingen te voorkomen. Klanten kunnen alleen boeken op tijden 
                        die je als beschikbaar hebt aangegeven.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Manage Bookings */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-accent-200/50 mb-8">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-600 text-xl font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-accent-600 mb-4">Beheer je boekingen</h3>
                    <p className="text-text-secondary mb-6">
                      Bekijk en beheer inkomende boekingsaanvragen. Accepteer of weiger aanvragen, communiceer met klanten en houd je agenda bij.
                    </p>
                    
                    <div className="bg-accent-50 rounded-xl p-6 mb-6">
                      <h4 className="font-semibold text-accent-700 mb-4">Boekingsworkflow</h4>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-medium flex-shrink-0">1</div>
                          <div>
                            <p className="font-medium text-accent-700">Nieuwe aanvraag</p>
                            <p className="text-sm text-accent-600">
                              Je ontvangt een nieuwe boekingsaanvraag van een klant
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-medium flex-shrink-0">2</div>
                          <div>
                            <p className="font-medium text-accent-700">Accepteren of weigeren</p>
                            <p className="text-sm text-accent-600">
                              Je kunt de aanvraag accepteren of weigeren, afhankelijk van je beschikbaarheid
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-medium flex-shrink-0">3</div>
                          <div>
                            <p className="font-medium text-accent-700">Dienst uitvoeren</p>
                            <p className="text-sm text-accent-600">
                              Voer de dienst uit op de afgesproken datum en tijd
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-medium flex-shrink-0">4</div>
                          <div>
                            <p className="font-medium text-accent-700">Afronden</p>
                            <p className="text-sm text-accent-600">
                              Markeer de dienst als voltooid en ontvang je betaling
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-green-50 rounded-xl p-4">
                        <h4 className="font-semibold text-green-800 mb-2">Communicatie met klanten</h4>
                        <p className="text-sm text-green-700">
                          Communiceer direct met klanten via het platform om details af te stemmen en vragen te beantwoorden.
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 rounded-xl p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Betalingen</h4>
                        <p className="text-sm text-blue-700">
                          Betalingen worden automatisch verwerkt via het platform. Je ontvangt je vergoeding na aftrek van de platformcommissie.
                        </p>
                      </div>
                    </div>
                    
                    {user && (
                      <div className="mt-6">
                        <Link 
                          href="/professional-dashboard"
                          className="bg-accent-600 hover:bg-accent-700 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
                        >
                          <Briefcase className="w-5 h-5" />
                          <span>Naar mijn dashboard</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 5: Get Paid */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-accent-200/50">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-600 text-xl font-bold">5</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-accent-600 mb-4">Ontvang betalingen</h3>
                    <p className="text-text-secondary mb-6">
                      Na het voltooien van een dienst ontvang je automatisch je betaling. Bekijk je inkomsten en facturen in je dashboard.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-accent-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
                          <Euro className="w-5 h-5 text-accent-600" />
                        </div>
                        <h4 className="font-semibold text-accent-700 mb-2">Betalingsverwerking</h4>
                        <p className="text-sm text-accent-600">
                          Betalingen worden automatisch verwerkt en overgemaakt naar je bankrekening
                        </p>
                      </div>
                      
                      <div className="bg-accent-50 rounded-xl p-4">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
                          <FileText className="w-5 h-5 text-accent-600" />
                        </div>
                        <h4 className="font-semibold text-accent-700 mb-2">Facturen en administratie</h4>
                        <p className="text-sm text-accent-600">
                          Alle facturen worden automatisch gegenereerd en zijn beschikbaar in je dashboard
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-800 mb-2">Betalingsvoorwaarden</h4>
                          <p className="text-sm text-blue-700">
                            Betalingen worden binnen 14 dagen na voltooiing van de dienst overgemaakt. Je kunt je betalingsgegevens 
                            instellen in je profiel.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <div className="bg-green-50 rounded-xl p-4">
                        <h4 className="font-semibold text-green-800 mb-2 flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>Beoordelingen en reputatie</span>
                        </h4>
                        <p className="text-sm text-green-700">
                          Goede beoordelingen helpen je om meer klanten aan te trekken. Zorg voor een uitstekende service en moedig 
                          tevreden klanten aan om een positieve beoordeling achter te laten.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 py-16 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Klaar om te beginnen?
          </h2>
          <p className="text-xl text-primary-100 mb-8 leading-relaxed">
            Maak vandaag nog een account aan en ontdek hoe Care & Service Pinoso je kan helpen.
          </p>
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                href="/signup?role=client"
                className="bg-white text-primary-600 px-10 py-4 rounded-lg text-lg font-bold hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
              >
                <User className="w-5 h-5 mr-2" />
                Account aanmaken als klant
              </Link>
              <Link 
                href="/signup?role=professional"
                className="bg-primary-700 text-white px-10 py-4 rounded-lg text-lg font-bold hover:bg-primary-800 transition-colors inline-flex items-center justify-center border border-primary-500"
              >
                <Briefcase className="w-5 h-5 mr-2" />
                Account aanmaken als professional
              </Link>
            </div>
          ) : (
            <Link 
              href="/dashboard"
              className="bg-white text-primary-600 px-10 py-4 rounded-lg text-lg font-bold hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
            >
              Naar mijn dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Create a HomeIcon component to fix the missing Home reference
function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
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
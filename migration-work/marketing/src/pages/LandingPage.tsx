import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X, Clock, Euro, Users, Award, TrendingUp, Building, Shield, Sparkles, CheckCircle, MapPin, Home, Heart, Car, Stethoscope, FileText, Wrench, Tag, Percent, Package } from 'lucide-react';
import { supabase, ServiceCategory, Service } from '../lib/supabase';

export function LandingPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch service categories
      const { data: categoriesData } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      // Fetch featured services (services with is_featured = true)
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order')
        .limit(3);

      setCategories(categoriesData || []);
      setFeaturedServices(servicesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testimonials = [
    {
      content: "Care & Service Pinoso heeft ons enorm geholpen bij het regelen van onze administratie in Spanje. De taalbarrière was voor ons een groot probleem, maar dankzij hun hulp is alles nu goed geregeld.",
      author: "Jan en Annemieke de Vries",
      role: "Nederlandse immigranten en expats in Pinoso",
      rating: 5,
      image: "https://images.pexels.com/photos/5302686/pexels-photo-5302686.jpeg?auhref=compress&cs=tinysrgb&w=150"
    },
    {
      content: "De huishoudelijke hulp is fantastisch. Alles wordt precies gedaan zoals we het willen, en het is zo fijn om in onze eigen taal te kunnen communiceren over onze wensen.",
      author: "Piet en Margriet Janssen",
      role: "Belgische immigranten en expats in Pinoso",
      rating: 5,
      image: "https://images.pexels.com/photos/5314219/pexels-photo-5314219.jpeg?auhref=compress&cs=tinysrgb&w=150"
    },
    {
      content: "Toen ik medische hulp nodig had, was Care & Service Pinoso er direct om me te helpen met vertaling bij de dokter en het ophalen van medicijnen. Een grote geruststelling als je in een vreemd land woont.",
      author: "Klaas Bakker",
      role: "Nederlandse immigrant en expat in Pinoso",
      rating: 5,
      image: "https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg?auhref=compress&cs=tinysrgb&w=150"
    },
  ];

  const stats = [
    {
      id: 1,
      name: "Tevreden klanten",
      value: "100+",
      icon: Users,
      color: "text-primary-500",
    },
    {
      id: 2,
      name: "Tevredenheid",
      value: "98%",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      id: 3,
      name: "Jaar ervaring",
      value: "10+",
      icon: Building,
      color: "text-primary-400",
    },
    {
      id: 4,
      name: "Betrouwbaarheid",
      value: "100%",
      icon: Award,
      color: "text-primary-600",
    },
  ];

  // Hero services list
  const heroServices = [
    "Huis- en huisdierenoppas",
    "Huishoudelijke hulp", 
    "Ouderen oppas en ondersteuning",
    "Vervoer en begeleiding",
    "Technische hulp"
  ];

  // Service category icons mapping
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('huishoudelijke') || name.includes('huis')) return Home;
    if (name.includes('zorg') || name.includes('persoonlijke')) return Heart;
    if (name.includes('transport') || name.includes('vervoer')) return Car;
    if (name.includes('medische') || name.includes('medisch')) return Stethoscope;
    if (name.includes('administratieve') || name.includes('admin')) return FileText;
    if (name.includes('property') || name.includes('onderhoud')) return Wrench;
    return Sparkles;
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Zorg & Service in Pinoso
              </h1>
              <p className="mt-6 text-xl text-primary-100 max-w-2xl">
                Betrouwbare ondersteuning voor en door Nederlandse en Belgische immigranten en expats
              </p>
              <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 transition-colors duration-200"
                >
                  Dienst boeken
                </Link>
                <Link
                  href="/service-provider-application"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-400 hover:bg-primary-300 transition-colors duration-200"
                >
                  Diensten verlenen <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
            
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-300 rounded-lg transform rotate-3 scale-105"></div>
                <div className="relative bg-white p-6 rounded-lg shadow-xl z-10">
                  <h3 className="text-lg font-semibold !text-text-primary mb-4">Populaire Diensten</h3>
                  <ul className="space-y-3">
                    {heroServices.map((service, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/diensten"
                    className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                  >
                    Bekijk alle diensten
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary-500 tracking-wide uppercase">Over ons</h2>
            <p className="mt-2 text-3xl font-extrabold text-primary-600 sm:text-4xl">
              Care & Service Pinoso
            </p>
            <p className="mt-4 max-w-2xl text-xl text-text-secondary mx-auto">
              Wij begrijpen de uitdagingen van het leven in een nieuw land. Daarom bieden we betrouwbare ondersteuning door mensen die jouw situatie begrijpen. Hier leggen we uit hoe het werkt.
            </p>
          </div>
          
          {/* How It Works Introduction */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-primary-50 rounded-xl p-8 shadow-lg border border-primary-200">
              <h3 className="text-2xl font-bold text-primary-600 mb-6 text-center">Hoe Werkt Het?</h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-semibold text-primary-700">Voor Klanten</h4>
                      <p className="text-primary-600">Vind betrouwbare professionals die je taal spreken en je situatie begrijpen</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-semibold text-primary-700">Voor Professionals</h4>
                      <p className="text-primary-600">Bied je diensten aan en help andere Nederlanders en Belgen in Pinoso</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <Link 
                    href="/hoe-werkt-het"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <span>Lees meer over hoe het werkt</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - 3 Services as Features */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-base font-semibold text-primary-500 tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-4xl md:text-5xl font-bold text-primary-600 mb-6">
              Onze Hoofddiensten
            </p>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ontdek onze meest populaire diensten die speciaal zijn ontwikkeld voor de Nederlandse en Belgische gemeenschap in Pinoso.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {!loading && featuredServices.slice(0, 3).map((service, index) => {
              const icons = [MapPin, Shield, Users]; // Feature icons
              const Icon = icons[index] || Sparkles;
              const colors = [
                'from-primary-500 to-primary-600',
                'from-accent-500 to-accent-600', 
                'from-secondary-500 to-secondary-600'
              ];
              
              return (
                <div key={service.id} className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className={`bg-gradient-to-br ${colors[index]} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary-600 mb-4">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {service.short_description}
                  </p>
                  <div className="text-sm text-primary-600 font-medium">
                    Doelgroep: {service.target_audience}
                  </div>
                </div>
              );
            })}
            
            {/* Fallback if no services loaded */}
            {(loading || featuredServices.length === 0) && (
              <>
                <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="bg-gradient-to-br from-primary-500 to-primary-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary-600 mb-4">
                    Lokale expertise
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Onze dienstverleners kennen Pinoso en de omgeving als hun broekzak. 
                    Ze begrijpen de lokale gewoonten en kunnen je wegwijs maken.
                  </p>
                </div>
                
                <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="bg-gradient-to-br from-accent-500 to-accent-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary-600 mb-4">
                    Betrouwbaar & veilig
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Alle dienstverleners zijn gescreend en beoordeeld door de gemeenschap. 
                    Jouw veiligheid en vertrouwen staan voorop.
                  </p>
                </div>
                
                <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary-600 mb-4">
                    Nederlandse gemeenschap
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Verbind met andere Nederlanders en Belgen in Pinoso. 
                    Deel ervaringen en bouw nieuwe vriendschappen op.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Services Section - 6 Visual Service Categories */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-base font-semibold text-primary-500 tracking-wide uppercase">Services</h2>
            <p className="mt-2 text-4xl md:text-5xl font-bold text-primary-600 mb-6">
              Onze Service Categorieën
            </p>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Van huishoudelijke hulp tot medische begeleiding - wij bieden een breed scala aan diensten 
              om uw leven in Spanje comfortabeler te maken.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {!loading && categories.slice(0, 6).map((category) => {
              const Icon = getCategoryIcon(category.name);
              // Gebruik de image_url uit de database als die bestaat
              const imageUrl = category.image_url || `https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=400`;
              
              return (
                <Link 
                  key={category.id} 
                  href="/diensten"
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 block"
                >
                  {/* Background Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=400';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    
                    {/* Icon Overlay */}
                    <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-primary-600 mb-3 group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {category.description}
                    </p>
                    
                    {/* Category Icon */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary-600">
                        Meer informatie →
                      </span>
                      <div className="text-2xl">
                        {category.icon}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            
            {/* Fallback categories if none loaded */}
            {(loading || categories.length === 0) && (
              <>
                {[
                  { name: 'Huishoudelijke Hulp', description: 'Schoonmaak en huishoudelijke ondersteuning', icon: '🏠' },
                  { name: 'Persoonlijke Zorg', description: 'Zorg en oppas diensten', icon: '❤️' },
                  { name: 'Transport Service', description: 'Vervoer en begeleiding', icon: '🚗' },
                  { name: 'Medische Begeleiding', description: 'Ondersteuning bij medische zaken', icon: '🏥' },
                  { name: 'Administratieve Hulp', description: 'Hulp bij bureaucratie', icon: '📋' },
                  { name: 'Property Management', description: 'Beheer en onderhoud', icon: '🔧' }
                ].map((category, index) => {
                  const icons = [Home, Heart, Car, Stethoscope, FileText, Wrench];
                  const Icon = icons[index];
                  const images = [
                    "https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auhref=compress&cs=tinysrgb&w=400",
                    "https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auhref=compress&cs=tinysrgb&w=400",
                    "https://images.pexels.com/photos/1118448/pexels-photo-1118448.jpeg?auhref=compress&cs=tinysrgb&w=400",
                    "https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auhref=compress&cs=tinysrgb&w=400",
                    "https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auhref=compress&cs=tinysrgb&w=400",
                    "https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auhref=compress&cs=tinysrgb&w=400"
                  ];
                  
                  return (
                    <Link 
                      key={index} 
                      href="/diensten"
                      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 block"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={images[index]}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                        <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary-600" />
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-primary-600 mb-3 group-hover:text-primary-600 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                          {category.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-primary-600">
                            Meer informatie →
                          </span>
                          <div className="text-2xl">
                            {category.icon}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Offers Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold text-primary-500 tracking-wide uppercase">Aanbiedingen</h2>
            <p className="mt-2 text-4xl md:text-5xl font-bold text-primary-600 mb-6">
              Speciale Aanbiedingen
            </p>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Profiteer van onze abonnementen, kortingen en servicebundels om te besparen op onze diensten.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Subscriptions */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-primary-600 mb-4">
                Abonnementen
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Kies een abonnement dat bij je past en bespaar op regelmatige diensten. Geniet van extra voordelen zoals prioriteit bij het plannen.
              </p>
              <Link 
                href="/aanbiedingen"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                Bekijk abonnementen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            
            {/* Discounts */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mb-6">
                <Percent className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-primary-600 mb-4">
                Kortingen
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Ontdek onze kortingscodes en speciale aanbiedingen. Profiteer van seizoensgebonden kortingen en loyaliteitsprogramma's.
              </p>
              <Link 
                href="/aanbiedingen?tab=discounts"
                className="inline-flex items-center text-accent-600 hover:text-accent-700 font-medium"
              >
                Bekijk kortingen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            
            {/* Service Bundles */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mb-6">
                <Tag className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-primary-600 mb-4">
                Servicebundels
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Combineer meerdere diensten in één bundel en profiteer van extra korting. Perfect voor wie meerdere diensten nodig heeft.
              </p>
              <Link 
                href="/aanbiedingen?tab=bundles"
                className="inline-flex items-center text-secondary-600 hover:text-secondary-700 font-medium"
              >
                Bekijk bundels
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Services Info Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-primary-600 mb-8">
                Meer dan alleen dienstverlening
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-primary-600 mb-2">Flexibele planning</h4>
                    <p className="text-gray-600">Plan diensten wanneer het jou uitkomt. Van eenmalige hulp tot regelmatige ondersteuning.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-primary-600 mb-2">Eerlijke prijzen</h4>
                    <p className="text-gray-600">Transparante tarieven zonder verborgen kosten. Betaal wat afgesproken is.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-primary-600 mb-2">Persoonlijke benadering</h4>
                    <p className="text-gray-600">Elke situatie is uniek. We luisteren naar jouw specifieke behoeften en wensen.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-3 h-3 bg-accent-400 rounded-full"></div>
                    <span className="font-medium text-gray-800">Huishoudelijke hulp</span>
                  </div>
                  <p className="text-sm text-gray-600">Wekelijkse schoonmaak en was</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
                    <span className="font-medium text-gray-800">Transport service</span>
                  </div>
                  <p className="text-sm text-gray-600">Vervoer naar ziekenhuis en winkels</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-3 h-3 bg-secondary-400 rounded-full"></div>
                    <span className="font-medium text-gray-800">Huisdierenoppas</span>
                  </div>
                  <p className="text-sm text-gray-600">Zorg voor je huisdieren tijdens vakantie</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="bg-primary-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.id} className="bg-white rounded-lg p-6 shadow-sm border border-primary-100 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 mx-auto">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-3xl font-extrabold text-text-primary">{stat.value}</p>
                  <p className="mt-2 text-base text-text-secondary">{stat.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary-500 tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl font-extrabold text-primary-600 sm:text-4xl">
              Wat onze klanten zeggen
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl shadow-md overflow-hidden p-6 flex flex-col h-full transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i} 
                      className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="flex-1">
                  <p className="text-text-secondary text-lg italic">"{testimonial.content}"</p>
                </blockquote>
                <div className="mt-6 flex items-center">
                  <div className="flex-shrink-0">
                    <img 
                      className="h-12 w-12 rounded-full object-cover" 
                      src={testimonial.image} 
                      alt={testimonial.author} 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auhref=compress&cs=tinysrgb&w=150';
                      }}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-base font-medium text-text-primary">{testimonial.author}</div>
                    <div className="text-sm text-text-secondary">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            Klaar om ondersteuning te krijgen of te bieden?
          </h2>
          <p className="text-xl text-white mb-12 leading-relaxed">
            Sluit je aan bij onze gemeenschap van Nederlanders en Belgen in Pinoso. 
            Samen maken we het leven hier makkelijker en leuker.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/signup"
              className="bg-white text-primary-600 px-10 py-4 rounded-lg text-lg font-bold hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
            >
              Start vandaag
            </Link>
            <Link 
              href="/service-provider-application"
              className="bg-primary-700 text-white px-10 py-4 rounded-lg text-lg font-bold hover:bg-primary-800 transition-colors inline-flex items-center justify-center border border-primary-500"
            >
              Word service professional
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
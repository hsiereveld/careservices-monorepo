import { notFound } from 'next/navigation'
import { languages, hero, type Language } from '@/lib/i18n'
import Header from '@/app/components/Header'
import FooterSection from '@/app/components/FooterSection'
import generateSEOMetadata from '@/components/SEO'
import Link from 'next/link'

interface LanguagePageProps {
  params: Promise<{
    lang: Language
  }>
}

export default async function LanguagePage({ params }: LanguagePageProps) {
  const { lang } = await params
  
  // Validate language exists
  if (!languages[lang]) {
    notFound()
  }

  const content = hero[lang]

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-500 to-primary-600 text-white py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-left lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                {content.title}
              </h1>
              <p className="text-xl mb-8 opacity-90 max-w-lg">
                {content.subtitle}
              </p>
              {/* Main Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/signup" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  {content.cta}
                </Link>
                <Link href="/professional-signup" className="flex items-center gap-2 text-white border border-white/30 px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                  {content.secondaryCta}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            
            {/* Right Column - Floating Card */}
            <div className="relative lg:flex justify-center hidden">
              <div className="bg-white/60 border border-white/30 backdrop-blur-md rounded-2xl p-6 shadow-2xl max-w-sm w-full transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-lg font-bold text-white mb-4">{content.popularServicesTitle}</h3>
                <div className="space-y-3">
                  {content.popularServices.map((service: string) => (
                    <div key={service} className="flex items-center gap-3 text-white">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-white">{service}</span>
                    </div>
                  ))}
                </div>
                <Link href="/diensten" className="w-full mt-6 bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors block text-center">
                  {content.viewAll}
                </Link>
              </div>
            </div>
          </div>
          {/* Mobile Card - Below content on mobile */}
          <div className="lg:hidden mt-12">
            <div className="bg-white/60 border border-white/30 backdrop-blur-md rounded-2xl p-6 shadow-xl max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-white mb-4">{content.popularServicesTitle}</h3>
              <div className="space-y-3">
                {content.popularServices.map((service: string, idx: number) => (
                  <div key={service} className="flex items-center gap-3 text-white">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm text-white">{service}</span>
                  </div>
                ))}
              </div>
              <Link href="/diensten" className="w-full mt-6 bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors block text-center">
                {content.viewAll}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Populaire Diensten Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary-600 mb-4">
            Populaire Diensten
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Ontdek onze meest gevraagde services voor Nederlandse en Belgische expats
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Service Card 1 - Huishoudelijke hulp */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Huishoudelijke hulp
              </h3>
              <p className="text-gray-600 mb-4">
                Van schoonmaak tot boodschappen, wij zorgen dat je huis er perfect uitziet 
                en je tijd hebt voor wat echt belangrijk is.
              </p>
              <div className="text-sm text-primary-600 font-medium">
                Vanaf €13,50 per uur
              </div>
            </div>
            {/* Service Card 2 - Vervoer & begeleiding */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Vervoer & begeleiding
              </h3>
              <p className="text-gray-600 mb-4">
                Veilig vervoer naar doktersafspraken, boodschappen of sociale activiteiten. 
                Hulp in je eigen taal.
              </p>
              <div className="text-sm text-primary-600 font-medium">
                Vanaf €0,29 per km
              </div>
            </div>
            {/* Service Card 3 - Ouderenzorg */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Ouderenzorg Services
              </h3>
              <p className="text-gray-600 mb-4">
                Gezelschap, basiszorg en ondersteuning voor senioren. 
                Ervaren professionals die je vertrouwt.
              </p>
              <div className="text-sm text-primary-600 font-medium">
                Gratis kennismaking
              </div>
            </div>
            {/* Service Card 4 - Technische hulp */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Technische hulp
              </h3>
              <p className="text-gray-600 mb-4">
                Van klusjesman tot elektricien, loodgieter en airco technicus. 
                Betrouwbare vakmannen voor al je onderhoud.
              </p>
              <div className="text-sm text-primary-600 font-medium">
                Vanaf €21,50 per uur
              </div>
            </div>
            {/* Service Card 5 - Administratieve ondersteuning */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Administratieve ondersteuning
              </h3>
              <p className="text-gray-600 mb-4">
                Hulp bij NIE nummer, empadronamiento, bankzaken en belasting aangifte. 
                Navigeer door de Spaanse bureaucratie.
              </p>
              <div className="text-sm text-primary-600 font-medium">
                Vanaf €20,87 per uur
              </div>
            </div>
            {/* Service Card 6 - Zwembad techniek */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Zwembad techniek
              </h3>
              <p className="text-gray-600 mb-4">
                Onderhoud, reparatie en chemie voor je zwembad. 
                Houd je zwembad kristalhelder en veilig.
              </p>
              <div className="text-sm text-primary-600 font-medium">
                Vanaf €20,00 per uur
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary-600 mb-4">
            Hoe werkt het?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            In een paar simpele stappen ben je verbonden met betrouwbare professionals
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Account aanmaken</h3>
              <p className="text-sm text-gray-600">
                Gratis registratie in enkele minuten. 
                Veilig & vertrouwd.
              </p>
            </div>
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Dienst zoeken</h3>
              <p className="text-sm text-gray-600">
                Blader door categorieën, filter op prijs en 
                bekijk beoordelingen van andere klanten.
              </p>
            </div>
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Boeken</h3>
              <p className="text-sm text-gray-600">
                Selecteer professional, kies datum en tijd, 
                en bevestig je boeking met één klik.
              </p>
            </div>
            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Genieten</h3>
              <p className="text-sm text-gray-600">
                Professionele service in je eigen taal. 
                Laat een beoordeling achter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-primary-100">Tevreden klanten</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-primary-100">Tevredenheid</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10+</div>
              <div className="text-primary-100">Jaar ervaring</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-primary-100">Betrouwbaarheid</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary-600 mb-12">
            Wat onze klanten zeggen
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Fantastische hulp bij onze administratie in Spanje. 
                Henk en zijn team maakten het ingewikkelde proces zo veel makkelijker."
              </p>
              <div className="font-semibold text-gray-800">Jan en Annemieke de Vries</div>
              <div className="text-sm text-gray-500">Administratieve ondersteuning</div>
            </div>
            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Wekelijkse huishoudelijke hulp die perfecte is. 
                Betrouwbaar, vriendelijk en altijd op tijd. Echt een aanrader!"
              </p>
              <div className="font-semibold text-gray-800">Piet en Margriet Janssen</div>
              <div className="text-sm text-gray-500">Huishoudelijke hulp</div>
            </div>
            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Geweldige begeleiding bij medische afspraken. 
                De vertaling en ondersteuning gaven veel vertrouwen."
              </p>
              <div className="font-semibold text-gray-800">Klaas Bakker</div>
              <div className="text-sm text-gray-500">Medische begeleiding</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Klaar om te beginnen?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Sluit je aan bij onze gemeenschap van Nederlandse en Belgische expats 
            en ontdek hoe makkelijk hulp vinden kan zijn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
              Word klant
            </Link>
            <Link href="/professional-signup" className="border-2 border-gray-600 text-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
              Word professional
            </Link>
          </div>
        </div>
      </section>

      <FooterSection />
    </>
  )
}

// Generate metadata for the page
export async function generateMetadata({ params }: LanguagePageProps) {
  const { lang } = await params
  const content = hero[lang]

  return generateSEOMetadata({
    title: content.title,
    description: content.subtitle,
    language: lang,
    url: `https://careservice.es/${lang}`,
    keywords: `care service spanje, expat services, huishoudelijke hulp, tuinonderhoud, zorg, beauty, transport, onderwijs, zakelijke diensten, nederlandse expats, belgische expats`
  })
}

// Generate static params for all supported languages
export async function generateStaticParams() {
  return [
    { lang: 'nl' },
    { lang: 'en' },
    { lang: 'es' }
  ]
} 
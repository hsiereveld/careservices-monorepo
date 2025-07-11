import { notFound } from 'next/navigation'
import { regions, type Language } from '@/lib/i18n'
import generateSEOMetadata from '@/components/SEO'
import RegionalHero from '@/components/RegionalHero'
import Header from '@/app/(marketing)/components/Header'

interface RegionalPageProps {
  params: Promise<{
    lang: Language
    region: string
  }>
}

export default async function RegionalPage({ params }: RegionalPageProps) {
  const { lang, region } = await params
  
  // Validate region exists
  const regionData = regions[region as keyof typeof regions]
  if (!regionData) {
    notFound()
  }

  const content = regionData[lang]

  return (
    <>
      <Header />
      
      <main>
        <RegionalHero region={region} language={lang} />
        
        {/* Services Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Onze diensten in {content.name}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Wij bieden een breed scala aan diensten voor expats in {content.name}. 
                Alle professionals zijn geverifieerd en spreken Nederlands, Engels of Spaans.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {content.services.map((service, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-4">🧹</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{service}</h3>
                  <p className="text-gray-600">
                    Professionele {service.toLowerCase()} diensten in {content.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Wat onze klanten in {content.name} zeggen
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {content.testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">{testimonial.service}</span>
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                  <p className="font-semibold text-gray-900">— {testimonial.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-primary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Klaar om te beginnen in {content.name}?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Registreer vandaag nog en vind de perfecte professional voor uw behoeften in {content.name}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/signup" 
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Registreer als klant
              </a>
              <a 
                href="/professional-signup" 
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary-600 transition-colors"
              >
                Word professional
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

// Generate metadata for the page
export async function generateMetadata({ params }: RegionalPageProps) {
  const { lang, region } = await params
  
  const regionData = regions[region as keyof typeof regions]
  if (!regionData) {
    return {}
  }

  const content = regionData[lang]

  return generateSEOMetadata({
    title: content.title,
    description: content.description,
    language: lang,
    region: content.name,
    url: `https://careservice.es/${lang}/${region}`,
    keywords: `care service ${region}, expat services ${region}, ${content.services.join(', ')}`
  })
}

// Generate static params for all supported regions and languages
export async function generateStaticParams() {
  const params: Array<{ lang: string; region: string }> = []
  
  Object.keys(regions).forEach(region => {
    ['nl', 'en', 'es'].forEach(lang => {
      params.push({ lang, region })
    })
  })
  
  return params
} 
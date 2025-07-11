'use client'

import { regions, type Language } from '@/lib/i18n'
import { StarIcon } from '@heroicons/react/20/solid'

interface RegionalHeroProps {
  region: string
  language: Language
}

export default function RegionalHero({ region, language }: RegionalHeroProps) {
  const regionData = regions[region as keyof typeof regions]
  
  if (!regionData) {
    return null
  }

  const content = regionData[language]

  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-white">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-100 mb-6">
              <span className="w-2 h-2 bg-blue-300 rounded-full mr-2"></span>
              {content.name}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {content.title}
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              {content.subtitle}
            </p>
            
            <p className="text-lg text-blue-200 mb-10 leading-relaxed">
              {content.description}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200 shadow-lg">
                Vind uw professional
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              
              <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-700 transition-colors duration-200">
                Word professional
              </button>
            </div>
          </div>
          
          {/* Services & Testimonials */}
          <div className="space-y-8">
            {/* Services */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Beschikbare diensten in {content.name}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {content.services.map((service, index) => (
                  <div key={index} className="flex items-center space-x-3 text-blue-100">
                    <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                    <span className="text-sm font-medium">{service}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Testimonials */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Wat onze klanten zeggen
              </h3>
              {content.testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 mb-4 last:mb-0">
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-blue-200">
                      {testimonial.service}
                    </span>
                  </div>
                  <p className="text-blue-100 text-sm leading-relaxed mb-2">
                    "{testimonial.text}"
                  </p>
                  <p className="text-blue-300 text-sm font-medium">
                    — {testimonial.name}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Trust Badges */}
            <div className="flex items-center justify-center space-x-6 text-blue-200">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Geverifieerd</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Veilig</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
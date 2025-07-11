import { Metadata } from 'next'
import { type Language } from '@/lib/i18n'

interface SEOProps {
  title: string
  description: string
  keywords?: string
  image?: string
  url?: string
  language?: Language
  region?: string
  type?: 'website' | 'article' | 'service'
  structuredData?: object
}

export default function generateMetadata({
  title,
  description,
  keywords,
  image = '/og-image.jpg',
  url,
  language = 'nl',
  region,
  type = 'website',
  structuredData
}: SEOProps): Metadata {
  const fullTitle = region 
    ? `${title} - Care & Service ${region}`
    : `${title} - Care & Service`
  
  const fullDescription = region
    ? `${description} Voor expats in ${region}, Spanje.`
    : description

  const defaultKeywords = [
    'care service',
    'expat services',
    'Spain',
    'cleaning',
    'gardening',
    'maintenance',
    'care',
    'beauty',
    'transport',
    'education',
    'business services'
  ]

  const regionalKeywords = region ? [
    ...defaultKeywords,
    region.toLowerCase(),
    'spanje',
    'spain',
    'expat',
    'dutch expat',
    'belgian expat'
  ] : defaultKeywords

  const finalKeywords = keywords 
    ? `${keywords}, ${regionalKeywords.join(', ')}`
    : regionalKeywords.join(', ')

  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Care & Service",
    "description": fullDescription,
    "url": url || "https://careservice.es",
    "telephone": "+34-XXX-XXX-XXX",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "ES",
      "addressRegion": region || "Spain"
    },
    "areaServed": region || "Spain",
    "serviceType": [
      "Cleaning Service",
      "Gardening Service", 
      "Maintenance Service",
      "Care Service",
      "Beauty Service"
    ],
    "availableLanguage": ["Dutch", "English", "Spanish"],
    "priceRange": "€€"
  }

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: finalKeywords,
    authors: [{ name: 'Care & Service' }],
    robots: 'index, follow',
    alternates: {
      canonical: url,
      languages: {
        'nl': `${url?.replace('/en/', '/nl/').replace('/es/', '/nl/') || 'https://careservice.es/nl'}`,
        'en': `${url?.replace('/nl/', '/en/').replace('/es/', '/en/') || 'https://careservice.es/en'}`,
        'es': `${url?.replace('/nl/', '/es/').replace('/en/', '/es/') || 'https://careservice.es/es'}`,
        'x-default': url || 'https://careservice.es'
      }
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      type: type as "article" | "website",
      url: url || "https://careservice.es",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle
        }
      ],
      siteName: "Care & Service",
      locale: language === 'nl' ? 'nl_NL' : language === 'en' ? 'en_US' : 'es_ES'
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [image]
    },
    other: {
      ...(region && {
        'geo.region': 'ES',
        'geo.placename': region,
        'geo.position': '38.4161;-3.7038',
        'ICBM': '38.4161, -3.7038'
      })
    },
    verification: {
      google: 'your-google-verification-code',
    }
  }
} 
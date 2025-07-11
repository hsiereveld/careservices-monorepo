// Simple i18n configuration for Care & Service
// Supports Dutch (primary), English, and Spanish

export type Locale = 'nl' | 'en' | 'es';

export const locales: Locale[] = ['nl', 'en', 'es'];

export const defaultLocale: Locale = 'nl';

// Language metadata
export const languageNames: Record<Locale, string> = {
  nl: 'Nederlands',
  en: 'English',
  es: 'Español',
};

export const languageFlags: Record<Locale, string> = {
  nl: '🇳🇱',
  en: '🇬🇧',
  es: '🇪🇸',
};

// Export languages object for components
export const languages: Record<Locale, { name: string; nativeName: string; flag: string }> = {
  nl: { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
};

// Navigation translations
export const navigation: Record<Locale, Record<string, string>> = {
  nl: {
    home: 'Home',
    booking: 'Boeken',
    services: 'Diensten',
    about: 'Over Ons',
    contact: 'Contact',
    login: 'Inloggen',
    signup: 'Registreren',
    profile: 'Profiel',
    dashboard: 'Dashboard',
  },
  en: {
    home: 'Home',
    booking: 'Book',
    services: 'Services',
    about: 'About',
    contact: 'Contact',
    login: 'Login',
    signup: 'Sign Up',
    profile: 'Profile',
    dashboard: 'Dashboard',
  },
  es: {
    home: 'Inicio',
    booking: 'Reservar',
    services: 'Servicios',
    about: 'Acerca de',
    contact: 'Contacto',
    login: 'Iniciar Sesión',
    signup: 'Registrarse',
    profile: 'Perfil',
    dashboard: 'Panel',
  },
};

// Hero content for landing pages
export const hero: Record<Locale, {
  title: string;
  subtitle: string;
  cta: string;
  secondaryCta: string;
  popularServicesTitle: string;
  popularServices: string[];
  viewAll: string;
}> = {
  nl: {
    title: 'Betrouwbare Zorg & Diensten in Pinoso',
    subtitle: 'Professionele hulp in je eigen taal. Van huishoudelijke hulp tot ouderenzorg.',
    cta: 'Nu Boeken',
    secondaryCta: 'Word Professional',
    popularServicesTitle: 'Populaire Diensten',
    popularServices: ['Huishoudelijke hulp', 'Vervoer & begeleiding', 'Ouderenzorg'],
    viewAll: 'Bekijk Alle Diensten',
  },
  en: {
    title: 'Reliable Care & Services in Pinoso',
    subtitle: 'Professional help in your own language. From household help to elderly care.',
    cta: 'Book Now',
    secondaryCta: 'Become Professional',
    popularServicesTitle: 'Popular Services',
    popularServices: ['Household help', 'Transport & assistance', 'Elderly care'],
    viewAll: 'View All Services',
  },
  es: {
    title: 'Cuidado y Servicios Confiables en Pinoso',
    subtitle: 'Ayuda profesional en tu propio idioma. Desde ayuda doméstica hasta cuidado de ancianos.',
    cta: 'Reservar Ahora',
    secondaryCta: 'Convertirse en Profesional',
    popularServicesTitle: 'Servicios Populares',
    popularServices: ['Ayuda doméstica', 'Transporte y asistencia', 'Cuidado de ancianos'],
    viewAll: 'Ver Todos los Servicios',
  },
};

// Type for Language
export type Language = Locale;

// Translation function
export function t(key: string, locale: Locale = defaultLocale): string {
  const translations: Record<string, Record<Locale, string>> = {
    'booking.title': { 
      nl: 'Boek een Dienst', 
      en: 'Book a Service', 
      es: 'Reservar un Servicio' 
    },
    'booking.subtitle': { 
      nl: 'Vind en boek de perfecte zorg- en dienstverlening', 
      en: 'Find and book the perfect care and service', 
      es: 'Encuentra y reserva el cuidado y servicio perfecto' 
    },
    'booking.categories.title': { 
      nl: 'Kies een Categorie', 
      en: 'Choose a Category', 
      es: 'Elige una Categoría' 
    },
    'booking.categories.subtitle': { 
      nl: 'Selecteer het type dienst dat u nodig heeft', 
      en: 'Select the type of service you need', 
      es: 'Selecciona el tipo de servicio que necesitas' 
    },
    'booking.services.title': { 
      nl: 'Beschikbare Diensten', 
      en: 'Available Services', 
      es: 'Servicios Disponibles' 
    },
    'booking.services.subtitle': { 
      nl: 'Kies uit onze professionele dienstverleners', 
      en: 'Choose from our professional service providers', 
      es: 'Elige entre nuestros proveedores profesionales' 
    },
    'booking.services.price': { 
      nl: 'Prijs', 
      en: 'Price', 
      es: 'Precio' 
    },
    'booking.services.duration': { 
      nl: 'Duur', 
      en: 'Duration', 
      es: 'Duración' 
    },
    'booking.services.rating': { 
      nl: 'Beoordeling', 
      en: 'Rating', 
      es: 'Calificación' 
    },
    'booking.services.bookNow': { 
      nl: 'Nu Boeken', 
      en: 'Book Now', 
      es: 'Reservar Ahora' 
    },
    'booking.providers.title': { 
      nl: 'Beschikbare Professionals', 
      en: 'Available Professionals', 
      es: 'Profesionales Disponibles' 
    },
    'booking.providers.subtitle': { 
      nl: 'Selecteer uw voorkeur professional', 
      en: 'Select your preferred professional', 
      es: 'Selecciona tu profesional preferido' 
    },
    'booking.providers.experience': { 
      nl: 'Ervaring', 
      en: 'Experience', 
      es: 'Experiencia' 
    },
    'booking.providers.specializations': { 
      nl: 'Specialisaties', 
      en: 'Specializations', 
      es: 'Especializaciones' 
    },
    'booking.providers.select': { 
      nl: 'Selecteren', 
      en: 'Select', 
      es: 'Seleccionar' 
    },
    'booking.calendar.title': { 
      nl: 'Kies Datum en Tijd', 
      en: 'Choose Date and Time', 
      es: 'Elige Fecha y Hora' 
    },
    'booking.calendar.subtitle': { 
      nl: 'Selecteer een beschikbare tijd', 
      en: 'Select an available time slot', 
      es: 'Selecciona una hora disponible' 
    },
    'booking.calendar.date': { 
      nl: 'Datum', 
      en: 'Date', 
      es: 'Fecha' 
    },
    'booking.calendar.time': { 
      nl: 'Tijd', 
      en: 'Time', 
      es: 'Hora' 
    },
    'booking.calendar.available': { 
      nl: 'Beschikbaar', 
      en: 'Available', 
      es: 'Disponible' 
    },
    'booking.calendar.unavailable': { 
      nl: 'Niet beschikbaar', 
      en: 'Unavailable', 
      es: 'No disponible' 
    },
    'booking.form.title': { 
      nl: 'Boekingsgegevens', 
      en: 'Booking Details', 
      es: 'Detalles de la Reserva' 
    },
    'booking.form.subtitle': { 
      nl: 'Vul uw gegevens in', 
      en: 'Fill in your information', 
      es: 'Completa tu información' 
    },
    'booking.form.name': { 
      nl: 'Naam', 
      en: 'Name', 
      es: 'Nombre' 
    },
    'booking.form.email': { 
      nl: 'E-mail', 
      en: 'Email', 
      es: 'Correo electrónico' 
    },
    'booking.form.phone': { 
      nl: 'Telefoon', 
      en: 'Phone', 
      es: 'Teléfono' 
    },
    'booking.form.address': { 
      nl: 'Adres', 
      en: 'Address', 
      es: 'Dirección' 
    },
    'booking.form.notes': { 
      nl: 'Opmerkingen', 
      en: 'Notes', 
      es: 'Notas' 
    },
    'booking.form.submit': { 
      nl: 'Bevestig Boeking', 
      en: 'Confirm Booking', 
      es: 'Confirmar Reserva' 
    },
    'booking.confirmation.title': { 
      nl: 'Boeking Bevestigd', 
      en: 'Booking Confirmed', 
      es: 'Reserva Confirmada' 
    },
    'booking.confirmation.subtitle': { 
      nl: 'Uw afspraak is succesvol gepland', 
      en: 'Your appointment has been successfully scheduled', 
      es: 'Tu cita ha sido programada exitosamente' 
    },
    'booking.confirmation.bookingId': { 
      nl: 'Boekingsnummer', 
      en: 'Booking ID', 
      es: 'ID de Reserva' 
    },
    'booking.confirmation.date': { 
      nl: 'Datum', 
      en: 'Date', 
      es: 'Fecha' 
    },
    'booking.confirmation.time': { 
      nl: 'Tijd', 
      en: 'Time', 
      es: 'Hora' 
    },
    'booking.confirmation.provider': { 
      nl: 'Professional', 
      en: 'Professional', 
      es: 'Profesional' 
    },
    'booking.confirmation.service': { 
      nl: 'Dienst', 
      en: 'Service', 
      es: 'Servicio' 
    },
    'booking.confirmation.total': { 
      nl: 'Totaal', 
      en: 'Total', 
      es: 'Total' 
    },
    'booking.confirmation.nextSteps': { 
      nl: 'Volgende Stappen', 
      en: 'Next Steps', 
      es: 'Próximos Pasos' 
    },
    'common.loading': { 
      nl: 'Laden...', 
      en: 'Loading...', 
      es: 'Cargando...' 
    },
    'common.error': { 
      nl: 'Er is een fout opgetreden', 
      en: 'An error occurred', 
      es: 'Ha ocurrido un error' 
    },
    'common.success': { 
      nl: 'Succesvol', 
      en: 'Success', 
      es: 'Éxito' 
    },
    'common.cancel': { 
      nl: 'Annuleren', 
      en: 'Cancel', 
      es: 'Cancelar' 
    },
    'common.save': { 
      nl: 'Opslaan', 
      en: 'Save', 
      es: 'Guardar' 
    },
    'common.edit': { 
      nl: 'Bewerken', 
      en: 'Edit', 
      es: 'Editar' 
    },
    'common.delete': { 
      nl: 'Verwijderen', 
      en: 'Delete', 
      es: 'Eliminar' 
    },
    'common.back': { 
      nl: 'Terug', 
      en: 'Back', 
      es: 'Atrás' 
    },
    'common.next': { 
      nl: 'Volgende', 
      en: 'Next', 
      es: 'Siguiente' 
    },
    'common.previous': { 
      nl: 'Vorige', 
      en: 'Previous', 
      es: 'Anterior' 
    },
    'common.search': { 
      nl: 'Zoeken', 
      en: 'Search', 
      es: 'Buscar' 
    },
    'common.filter': { 
      nl: 'Filter', 
      en: 'Filter', 
      es: 'Filtrar' 
    },
    'common.sort': { 
      nl: 'Sorteren', 
      en: 'Sort', 
      es: 'Ordenar' 
    },
    'navigation.home': { 
      nl: 'Home', 
      en: 'Home', 
      es: 'Inicio' 
    },
    'navigation.booking': { 
      nl: 'Boeken', 
      en: 'Book', 
      es: 'Reservar' 
    },
    'navigation.services': { 
      nl: 'Diensten', 
      en: 'Services', 
      es: 'Servicios' 
    },
    'navigation.about': { 
      nl: 'Over Ons', 
      en: 'About', 
      es: 'Acerca de' 
    },
    'navigation.contact': { 
      nl: 'Contact', 
      en: 'Contact', 
      es: 'Contacto' 
    },
    'navigation.login': { 
      nl: 'Inloggen', 
      en: 'Login', 
      es: 'Iniciar Sesión' 
    },
    'navigation.signup': { 
      nl: 'Registreren', 
      en: 'Sign Up', 
      es: 'Registrarse' 
    },
    'navigation.profile': { 
      nl: 'Profiel', 
      en: 'Profile', 
      es: 'Perfil' 
    },
    'navigation.dashboard': { 
      nl: 'Dashboard', 
      en: 'Dashboard', 
      es: 'Panel' 
    }
  };

  return translations[key]?.[locale] || key;
}

// Utility functions
export function getLocaleFromPath(pathname: string): Locale {
  const pathSegments = pathname.split('/');
  const localeSegment = pathSegments[1];
  
  if (localeSegment && locales.includes(localeSegment as Locale)) {
    return localeSegment as Locale;
  }
  
  return defaultLocale;
}

export function getPathWithLocale(pathname: string, locale: Locale): string {
  const pathSegments = pathname.split('/');
  const currentLocale = getLocaleFromPath(pathname);
  
  if (currentLocale === defaultLocale && pathSegments[1] === defaultLocale) {
    // Replace default locale with new locale
    pathSegments[1] = locale;
  } else if (currentLocale !== defaultLocale) {
    // Replace current locale with new locale
    pathSegments[1] = locale;
  } else {
    // Insert locale at beginning
    pathSegments.splice(1, 0, locale);
  }
  
  return pathSegments.join('/');
}

// Alias functions for backward compatibility
export const getLanguageFromPath = getLocaleFromPath;
export const getPathWithLanguage = getPathWithLocale; 
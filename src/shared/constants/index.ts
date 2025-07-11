export const APP_CONFIG = {
  APP_NAME: 'Care & Services',
  COMPANY_NAME: 'Care & Services Platform',
  COMMISSION_RATE: 0.15, // 15%
  CONTACT_EMAIL: 'info@careservices.es',
  SUPPORT_EMAIL: 'support@careservices.es',
  PHONE: '+34 XXX XXX XXX',
  ADDRESS: 'Pinoso, Valencia, España'
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SERVICES: '/services',
  BOOKINGS: '/bookings',
  PAYMENTS: '/payments',
  REVIEWS: '/reviews'
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile'
  },
  SERVICES: {
    LIST: '/api/services',
    CREATE: '/api/services',
    UPDATE: '/api/services/:id',
    DELETE: '/api/services/:id'
  },
  BOOKINGS: {
    LIST: '/api/bookings',
    CREATE: '/api/bookings',
    UPDATE: '/api/bookings/:id',
    CANCEL: '/api/bookings/:id/cancel'
  },
  PAYMENTS: {
    CREATE: '/api/payments',
    STATUS: '/api/payments/:id/status'
  }
}; 
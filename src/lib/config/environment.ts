interface EnvironmentConfig {
  app: {
    url: string
    environment: 'development' | 'staging' | 'production'
    version: string
  }
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey: string
  }
  domains: {
    main: string
    my: string
    book: string
    pro: string
    admin: string
  }
  payments: {
    mollieApiKey: string
    mollieWebhookSecret: string
    commissionRate: number
  }
  email: {
    apiKey: string
    fromEmail: string
  }
  upload: {
    cloudinaryCloudName: string
    cloudinaryApiKey: string
    cloudinaryApiSecret: string
  }
  monitoring: {
    sentryDsn: string
    googleAnalyticsId: string
  }
  features: {
    enableAnalytics: boolean
    enableMonitoring: boolean
    enableBackups: boolean
    maxFileSize: number
    rateLimit: {
      requests: number
      window: number
    }
  }
}

export const config: EnvironmentConfig = {
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL!,
    environment: (process.env.NEXT_PUBLIC_ENVIRONMENT as any) || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  },
  domains: {
    main: process.env.NEXT_PUBLIC_MAIN_DOMAIN!,
    my: process.env.NEXT_PUBLIC_MY_SUBDOMAIN!,
    book: process.env.NEXT_PUBLIC_BOOK_SUBDOMAIN!,
    pro: process.env.NEXT_PUBLIC_PRO_SUBDOMAIN!,
    admin: process.env.NEXT_PUBLIC_ADMIN_SUBDOMAIN!
  },
  payments: {
    mollieApiKey: process.env.MOLLIE_API_KEY!,
    mollieWebhookSecret: process.env.MOLLIE_WEBHOOK_SECRET!,
    commissionRate: 0.15 // 15% commissie
  },
  email: {
    apiKey: process.env.RESEND_API_KEY!,
    fromEmail: process.env.NEXT_PUBLIC_FROM_EMAIL!
  },
  upload: {
    cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY!,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET!
  },
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN!,
    googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID!
  },
  features: {
    enableAnalytics: (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'),
    enableMonitoring: (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'development'),
    enableBackups: (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'),
    maxFileSize: 10 * 1024 * 1024, // 10MB
    rateLimit: {
      requests: 100,
      window: 60 * 1000 // 1 minute
    }
  }
} 
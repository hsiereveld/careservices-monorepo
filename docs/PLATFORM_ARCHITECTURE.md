# 🏗️ Platform Architecture - Care & Service

> **Complete technical architecture for the Care & Service marketplace platform**

## 📋 **Overview**

Het Care & Service platform is een moderne, schaalbare marketplace voor zorg- en dienstverlening in de Costa Blanca regio. De architectuur ondersteunt multi-tenant franchise operaties met een modulaire app-gebaseerde structuur.

---

## 🌐 **DOMAIN ARCHITECTURE**

### **Primary Domain Strategy**
**Base Domain**: `*.careservice.es`

### **Application Subdomains**
```
┌─────────────────────────────────────────────────────────────┐
│                    CARESERVICE.ES ECOSYSTEM                │
├─────────────────────────────────────────────────────────────┤
│  🌍 careservice.es                 │ Marketing Website     │
│  👤 my.careservice.es              │ Customer Dashboard    │
│  📅 book.careservice.es            │ Booking Module        │
│  💼 pro.careservice.es             │ Professional Dashboard│
│  ⚙️  admin.careservice.es          │ Administrator Panel   │
└─────────────────────────────────────────────────────────────┘
```

### **Regional Franchise Domains**
```
┌─────────────────────────────────────────────────────────────┐
│                  FRANCHISE SUBDOMAINS                      │
├─────────────────────────────────────────────────────────────┤
│  🏘️  pinoso.careservice.es         │ Pinoso Franchise      │
│  🏖️  costablanca.careservice.es    │ Costa Blanca Region   │
│  🏛️  valencia.careservice.es       │ Valencia Province     │
│  🌊 alicante.careservice.es        │ Alicante Province     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ **HIGH-LEVEL ARCHITECTURE**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │   BACKEND       │    │   EXTERNAL      │
│   (Next.js)     │────│   (Supabase)    │────│   SERVICES      │
│                 │    │                 │    │                 │
│ careservice.es  │    │ • PostgreSQL    │    │ • Mollie API    │
│ my.careservice  │    │ • Auth System   │    │ • Email Service │
│ book.careservice│    │ • Real-time     │    │ • SMS Service   │
│ pro.careservice │    │ • File Storage  │    │ • Analytics     │
│ admin.careservice│   │ • Edge Functions│    │ • CDN Services  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📱 **APPLICATION ARCHITECTURE**

### **1. Marketing Website (`careservice.es`)**
```
careservice.es/
├── /                          # Homepage
├── /diensten                  # Service catalog
├── /hoe-werkt-het            # How it works
├── /over-ons                 # About us
├── /contact                  # Contact
├── /login                    # Login redirect
├── /signup                   # Registration
└── /professional-signup      # Professional onboarding
```

**Purpose**: Public marketing site, SEO, lead generation
**Users**: Prospective customers and professionals
**Technology**: Next.js SSG, optimized for SEO

### **2. Customer Dashboard (`my.careservice.es`)**
```
my.careservice.es/
├── /                         # Dashboard overview
├── /bookings                 # My bookings
├── /history                  # Booking history
├── /favorites               # Favorite providers
├── /reviews                 # My reviews
├── /profile                 # Account settings
└── /billing                 # Payment history
```

**Purpose**: Customer account management and booking oversight
**Users**: Registered customers
**Technology**: Next.js SSR with real-time updates

### **3. Booking Module (`book.careservice.es`)**
```
book.careservice.es/
├── /                         # Service discovery
├── /category/[id]           # Category services
├── /service/[id]            # Service details
├── /provider/[id]           # Provider profile
├── /calendar               # Availability calendar
├── /form                   # Booking form
├── /payment/[id]           # Payment processing
├── /confirmation/[id]      # Booking confirmation
└── /success               # Payment success
```

**Purpose**: Complete booking flow from discovery to payment
**Users**: All users (guests and authenticated)
**Technology**: Next.js SSR/CSR hybrid with payment integration

### **4. Professional Dashboard (`pro.careservice.es`)**
```
pro.careservice.es/
├── /                         # Professional overview
├── /bookings                # My appointments
├── /calendar                # Schedule management
├── /services                # Service offerings
├── /earnings                # Financial overview
├── /reviews                 # Customer feedback
├── /profile                 # Professional profile
├── /availability           # Availability settings
└── /analytics              # Performance metrics
```

**Purpose**: Professional service provider management
**Users**: Registered professionals
**Technology**: Next.js SSR with real-time booking updates

### **5. Administrator Dashboard (`admin.careservice.es`)**
```
admin.careservice.es/
├── /                         # Admin overview
├── /users                   # User management
├── /professionals          # Provider oversight
├── /bookings               # All bookings
├── /finances               # Revenue analytics
├── /quality                # Quality control
├── /franchises             # Franchise management
├── /services               # Service catalog admin
├── /analytics              # Platform analytics
└── /settings               # System configuration
```

**Purpose**: Platform administration and franchise management
**Users**: Admins, backoffice, franchise owners
**Technology**: Next.js SSR with comprehensive analytics

---

## 🏢 **MULTI-TENANT FRANCHISE ARCHITECTURE**

### **Franchise Isolation Model**
```
┌──────────────────────────────────────────────────────────────┐
│                    PLATFORM CORE                            │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   PINOSO    │  │ COSTA BLANCA│  │  VALENCIA   │        │
│  │ Franchise   │  │  Franchise  │  │  Franchise  │        │
│  │             │  │             │  │             │        │
│  │ • Providers │  │ • Providers │  │ • Providers │        │
│  │ • Customers │  │ • Customers │  │ • Customers │        │
│  │ • Bookings  │  │ • Bookings  │  │ • Bookings  │        │
│  │ • Revenue   │  │ • Revenue   │  │ • Revenue   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

### **Franchise-Specific Routing**
```javascript
// Middleware routing logic
if (subdomain === 'pinoso') {
  franchise_id = 'pinoso-franchise-id'
  redirect('/pinoso-specific-content')
} else if (subdomain === 'costablanca') {
  franchise_id = 'costablanca-franchise-id'
  redirect('/costablanca-specific-content')
}
```

---

## 🗄️ **DATABASE ARCHITECTURE**

### **Multi-Tenant Data Model**
```sql
-- Core franchise structure
CREATE TABLE franchises (
  id UUID PRIMARY KEY,
  subdomain VARCHAR(50) UNIQUE, -- pinoso, costablanca, valencia
  region VARCHAR(100),
  name VARCHAR(200),
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  domain_config JSONB -- Custom domain settings
);

-- All business entities reference franchise_id
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id),
  franchise_id UUID REFERENCES franchises(id),
  first_name VARCHAR(100),
  user_type VARCHAR(20), -- customer, professional
  preferred_app VARCHAR(20) -- my, pro, admin
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  franchise_id UUID REFERENCES franchises(id),
  customer_id UUID REFERENCES profiles(id),
  provider_id UUID REFERENCES service_providers(id),
  booking_source VARCHAR(20) -- book.careservice.es
);
```

### **Row Level Security (RLS) per App**
```sql
-- App-specific data access
CREATE POLICY "customer_app_access" ON bookings
  FOR ALL USING (
    customer_id = auth.uid() AND 
    current_setting('app.name') = 'my.careservice.es'
  );

CREATE POLICY "professional_app_access" ON bookings
  FOR ALL USING (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    ) AND current_setting('app.name') = 'pro.careservice.es'
  );

CREATE POLICY "admin_app_access" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'backoffice')
    ) AND current_setting('app.name') = 'admin.careservice.es'
  );
```

---

## 🎭 **ROLE-BASED APP ACCESS**

### **User Role → App Mapping**
```
┌─────────────────────────────────────────────────────────────┐
│                    APP ACCESS MATRIX                        │
├─────────────────────────────────────────────────────────────┤
│ ROLE               │ PRIMARY APP        │ SECONDARY ACCESS   │
├─────────────────────────────────────────────────────────────┤
│ customer           │ my.careservice.es  │ book.careservice   │
│ professional       │ pro.careservice.es │ book.careservice   │
│ admin              │ admin.careservice  │ All apps           │
│ backoffice         │ admin.careservice  │ my., pro.          │
│ franchise_owner    │ admin.careservice  │ All franchise apps │
│ franchise_manager  │ admin.careservice  │ Local franchise    │
│ guest              │ careservice.es     │ book.careservice   │
└─────────────────────────────────────────────────────────────┘
```

### **Authentication Flow per App**
```javascript
// App-specific authentication
const authConfig = {
  'careservice.es': {
    allowGuests: true,
    redirectAfterLogin: '/my'
  },
  'my.careservice.es': {
    requireAuth: true,
    allowedRoles: ['customer'],
    redirectUnauthorized: '/login'
  },
  'book.careservice.es': {
    allowGuests: true,
    requireAuthForBooking: true,
    guestBookingAllowed: true
  },
  'pro.careservice.es': {
    requireAuth: true,
    allowedRoles: ['professional'],
    redirectUnauthorized: '/professional-login'
  },
  'admin.careservice.es': {
    requireAuth: true,
    allowedRoles: ['admin', 'backoffice', 'franchise_owner'],
    redirectUnauthorized: '/admin-login'
  }
}
```

---

## 🔄 **INTER-APP COMMUNICATION**

### **Cross-App Data Flow**
```
1. Customer books on book.careservice.es
   ↓
2. Booking data stored in central database
   ↓
3. Real-time notification to pro.careservice.es
   ↓
4. Professional accepts/declines
   ↓
5. Status update visible on my.careservice.es
   ↓
6. Analytics updated on admin.careservice.es
```

### **Shared Components & State**
```typescript
// Shared authentication context
export const useAuth = () => {
  const { user, session } = useSupabaseAuth()
  const currentApp = getCurrentApp() // careservice.es, my., book., etc.
  
  return {
    user,
    session,
    hasAccessToApp: (app: string) => checkAppAccess(user, app),
    redirectToApp: (app: string) => redirectToSubdomain(app)
  }
}

// Cross-app navigation
export const navigateToApp = (app: string, path: string) => {
  const baseUrl = `https://${app}.careservice.es`
  window.location.href = `${baseUrl}${path}`
}
```

---

## 💳 **PAYMENT ARCHITECTURE**

### **Payment Flow Across Apps**
```
1. Customer initiates booking on book.careservice.es
   ↓
2. Payment calculation with franchise commission
   ↓
3. Redirect to Mollie payment gateway
   ↓
4. Payment completion webhook
   ↓
5. Update booking status across all apps
   ↓
6. Revenue distribution calculation
   ↓
7. Notifications sent to relevant apps
```

### **Revenue Sharing per Franchise**
```sql
CREATE FUNCTION calculate_franchise_revenue(
  booking_id UUID,
  total_amount DECIMAL
) RETURNS JSON AS $$
DECLARE
  franchise_rate DECIMAL;
  platform_rate DECIMAL := 5.00; -- 5% platform fee
BEGIN
  SELECT commission_rate INTO franchise_rate 
  FROM franchises f
  JOIN bookings b ON b.franchise_id = f.id
  WHERE b.id = booking_id;
  
  RETURN json_build_object(
    'platform_revenue', total_amount * platform_rate / 100,
    'franchise_revenue', total_amount * franchise_rate / 100,
    'professional_revenue', total_amount * (100 - platform_rate - franchise_rate) / 100
  );
END;
$$;
```

---

## 🔐 **SECURITY ARCHITECTURE**

### **App-Level Security**
```
┌─────────────────────────────────────────────────────────────┐
│  DOMAIN SECURITY                                            │
│  • SSL certificates per subdomain                          │
│  • CORS policies per app                                   │
│  • CSP headers customized per app                          │
├─────────────────────────────────────────────────────────────┤
│  APPLICATION SECURITY                                       │
│  • App-specific authentication                             │
│  • Role-based route protection                             │
│  • API endpoint access control                             │
├─────────────────────────────────────────────────────────────┤
│  DATA SECURITY                                              │
│  • Row Level Security per app context                      │
│  • Franchise data isolation                                │
│  • Audit trails per app action                             │
└─────────────────────────────────────────────────────────────┘
```

### **Cross-App Security**
```typescript
// Middleware security per app
export function middleware(request: NextRequest) {
  const subdomain = getSubdomain(request.url)
  const userRole = getUserRole(request)
  
  // App-specific security rules
  const securityRules = {
    'my': { requireAuth: true, allowedRoles: ['customer'] },
    'pro': { requireAuth: true, allowedRoles: ['professional'] },
    'admin': { requireAuth: true, allowedRoles: ['admin', 'backoffice'] },
    'book': { allowGuests: true, requireAuthForPayment: true }
  }
  
  return enforceSecurityRules(subdomain, userRole, securityRules)
}
```

---

## 📱 **DEPLOYMENT ARCHITECTURE**

### **Multi-App Deployment Strategy**
```
┌─────────────────────────────────────────────────────────────┐
│                    NETLIFY DEPLOYMENT                       │
├─────────────────────────────────────────────────────────────┤
│  Main Site (careservice.es)                                │
│  ├── Build: npm run build:marketing                        │
│  └── Deploy: dist/marketing                                │
├─────────────────────────────────────────────────────────────┤
│  Customer App (my.careservice.es)                          │
│  ├── Build: npm run build:customer                         │
│  └── Deploy: dist/customer                                 │
├─────────────────────────────────────────────────────────────┤
│  Booking App (book.careservice.es)                         │
│  ├── Build: npm run build:booking                          │
│  └── Deploy: dist/booking                                  │
├─────────────────────────────────────────────────────────────┤
│  Professional App (pro.careservice.es)                     │
│  ├── Build: npm run build:professional                     │
│  └── Deploy: dist/professional                             │
├─────────────────────────────────────────────────────────────┤
│  Admin App (admin.careservice.es)                          │
│  ├── Build: npm run build:admin                            │
│  └── Deploy: dist/admin                                    │
└─────────────────────────────────────────────────────────────┘
```

### **CDN & Performance per App**
```
User Request to my.careservice.es
   ↓
Netlify Edge (Spain/Europe)
   ↓
Customer App (Optimized for dashboard)
   ↓
Supabase (Customer data with RLS)
   ↓
Real-time updates (WebSocket)
```

---

## 🔮 **SCALABILITY ARCHITECTURE**

### **App-Specific Scaling**
- **Marketing Site**: Static generation, global CDN
- **Customer Dashboard**: Server-side rendering, regional caching
- **Booking Module**: Hybrid SSR/CSR, payment optimization
- **Professional Dashboard**: Real-time updates, optimistic UI
- **Admin Panel**: Server-side rendering, comprehensive analytics

### **Database Scaling per App Usage**
```sql
-- App-specific indexing
CREATE INDEX idx_bookings_customer_app ON bookings(customer_id, created_at) 
WHERE app_source = 'my.careservice.es';

CREATE INDEX idx_bookings_professional_app ON bookings(provider_id, booking_date) 
WHERE app_source = 'pro.careservice.es';

CREATE INDEX idx_bookings_admin_analytics ON bookings(franchise_id, created_at, status) 
WHERE app_source = 'admin.careservice.es';
```

---

## 🎯 **BUSINESS LOGIC ARCHITECTURE**

### **App-Specific Business Flows**

#### **Marketing Website Flow**
```
Visitor lands on careservice.es
   ↓
Browses services and information
   ↓
Clicks "Book Now" → Redirects to book.careservice.es
   ↓
Or clicks "Join as Professional" → Registration flow
```

#### **Customer Journey**
```
Customer logs into my.careservice.es
   ↓
Views dashboard with upcoming bookings
   ↓
Clicks "Book New Service" → book.careservice.es
   ↓
Completes booking → Returns to my.careservice.es
   ↓
Tracks booking status in real-time
```

#### **Professional Workflow**
```
Professional accesses pro.careservice.es
   ↓
Reviews new booking requests
   ↓
Accepts/declines bookings
   ↓
Manages schedule and availability
   ↓
Tracks earnings and reviews
```

#### **Admin Operations**
```
Admin logs into admin.careservice.es
   ↓
Monitors platform health and metrics
   ↓
Manages users and professionals
   ↓
Oversees franchise operations
   ↓
Generates business intelligence reports
```

---

## 📊 **MONITORING & ANALYTICS**

### **App-Specific Monitoring**
```
┌─────────────────────────────────────────────────────────────┐
│  PERFORMANCE MONITORING                                      │
│  • careservice.es → SEO metrics, conversion rates          │
│  • my.careservice.es → User engagement, retention          │
│  • book.careservice.es → Conversion funnel, abandonment    │
│  • pro.careservice.es → Professional activity, earnings    │
│  • admin.careservice.es → System health, admin actions     │
└─────────────────────────────────────────────────────────────┘
```

### **Cross-App Analytics**
```sql
-- Business intelligence across apps
CREATE VIEW platform_analytics AS
SELECT 
  date_trunc('day', created_at) as date,
  app_source,
  COUNT(*) as daily_bookings,
  SUM(total_amount) as daily_revenue,
  franchise_id
FROM bookings
GROUP BY date, app_source, franchise_id
ORDER BY date DESC;
```

---

Deze architectuur ondersteunt het volledige Care & Service ecosysteem met een modulaire, schaalbare aanpak die groei van lokale service in Pinoso tot regionale franchise expansie over heel Spanje mogelijk maakt. 
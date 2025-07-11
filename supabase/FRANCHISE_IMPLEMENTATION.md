# 🏢 Franchise Schema Implementation Guide

## 📋 Overzicht

Dit document beschrijft de implementatie van het franchise-ondersteunde database schema voor Care & Service Pinoso. Het schema ondersteunt multi-regionale operaties met franchise isolatie, commission management, en admin-gecontroleerde service categorieën.

## 🗄️ Database Schema

### Nieuwe Tabellen

#### 1. `franchises`
- **Doel:** Franchise/regio management
- **Belangrijke velden:**
  - `slug`: Unieke identifier (e.g., 'pinoso', 'alicante')
  - `commission_rate`: Standaard commissie percentage (15%)
  - `is_active`: Franchise status

#### 2. `service_categories`
- **Doel:** Admin-gecontroleerde service categorieën
- **Belangrijke velden:**
  - `name`: Categorie naam
  - `icon`: Icon voor UI
  - `sort_order`: Volgorde in UI

#### 3. `commission_requests`
- **Doel:** Professional requests voor commission wijzigingen
- **Workflow:** Professional → Admin review → Approval/Rejection

### Uitgebreide Tabellen

#### `profiles` (Uitgebreid)
- **Nieuw veld:** `franchise_id` - Koppeling naar franchise

#### `services` (Uitgebreid)
- **Nieuwe velden:**
  - `category_id` - Koppeling naar service categorie
  - `franchise_id` - Franchise scope
  - `base_price` - Basis prijs (professional)
  - `commission_rate` - Commissie percentage
  - `final_price` - Geautomatiseerde berekening (base_price + commission)

#### `bookings` (Uitgebreid)
- **Nieuwe velden:**
  - `franchise_id` - Franchise scope
  - `base_amount` - Basis bedrag
  - `commission_amount` - Commissie bedrag
  - `total_amount` - Totaal bedrag

## 🔐 Row Level Security (RLS)

### Franchise Isolation
Alle queries zijn franchise-scoped:
```sql
-- Voorbeeld: Services in huidige franchise
franchise_id = COALESCE(
  (SELECT franchise_id FROM public.profiles WHERE id = auth.uid()),
  (SELECT id FROM public.franchises WHERE slug = 'pinoso' LIMIT 1)
)
```

### Admin-Only Tables
- `franchises` - Alleen admin/backoffice
- `service_categories` - Alleen admin/backoffice

### Professional-Only Actions
- `commission_requests` - Professionals kunnen requests maken
- `services` - Professionals kunnen eigen services beheren

## 💰 Commission Workflow

### 1. Standaard Commission
- Franchise heeft standaard commission rate (15%)
- Services erven deze rate, tenzij overschreven

### 2. Commission Request Process
```
Professional → Request Commission Change → Admin Review → Approval/Rejection
```

### 3. Pricing Calculation
```sql
final_price = base_price * (1 + commission_rate / 100)
```

## 🚀 Implementatie Stappen

### Stap 1: Database Schema Toepassen

1. **Backup huidige database:**
```bash
# In Supabase Dashboard of via CLI
pg_dump your_database > backup_before_franchise.sql
```

2. **Schema toepassen:**
```sql
-- Voer het franchise schema uit
\i supabase/franchise-schema.sql
```

3. **Verificeer implementatie:**
```sql
-- Check nieuwe tabellen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('franchises', 'service_categories', 'commission_requests');

-- Check franchise data
SELECT * FROM public.franchises;
SELECT * FROM public.service_categories;
```

### Stap 2: TypeScript Types Updaten

1. **Genereer nieuwe types:**
```bash
npx supabase gen types typescript --project-id <project-id> --schema public > packages/types/supabase.types.ts
```

2. **Verificeer types:**
```typescript
// Test nieuwe types
import { Database } from '@/packages/types/supabase.types'

type Franchise = Database['public']['Tables']['franchises']['Row']
type ServiceCategory = Database['public']['Tables']['service_categories']['Row']
```

### Stap 3: API Routes Updaten

#### Franchise-Scoped Queries
Alle API routes moeten franchise-scoped zijn:

```typescript
// Voorbeeld: Services API
const { data: services } = await supabase
  .from('services')
  .select('*')
  .eq('franchise_id', currentFranchiseId)
  .eq('is_active', true)
```

#### Commission Request API
```typescript
// POST /api/commission-requests
export async function POST(request: Request) {
  const { serviceId, requestedRate, reason } = await request.json()
  
  const { data, error } = await supabase
    .from('commission_requests')
    .insert({
      professional_id: userId,
      service_id: serviceId,
      franchise_id: currentFranchiseId,
      current_commission_rate: currentRate,
      requested_commission_rate: requestedRate,
      reason
    })
}
```

### Stap 4: UI/UX Updates

#### Region Selector Component
```typescript
// Component voor franchise/regio selectie
const RegionSelector = () => {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [currentFranchise, setCurrentFranchise] = useState<Franchise | null>(null)
  
  // Load franchises
  // Handle franchise selection
  // Update global state
}
```

#### Commission Request Form
```typescript
// Form voor professionals om commission wijzigingen te requesten
const CommissionRequestForm = ({ serviceId }: { serviceId: string }) => {
  const [requestedRate, setRequestedRate] = useState<number>(0)
  const [reason, setReason] = useState<string>('')
  
  const handleSubmit = async () => {
    // Submit commission request
  }
}
```

## 📊 Business Rules

### 1. Franchise Isolation
- Alle data is franchise-scoped
- Users kunnen alleen data in hun franchise zien
- Cross-franchise queries zijn niet toegestaan

### 2. Admin Control
- Alleen admin/backoffice kan:
  - Franchises beheren
  - Service categorieën beheren
  - Commission requests goedkeuren/afwijzen

### 3. Professional Autonomy
- Professionals kunnen:
  - Eigen services beheren
  - Commission requests indienen
  - Eigen beschikbaarheid beheren

### 4. Pricing Transparency
- Base price (professional) + Commission = Final price
- Commission wordt duidelijk getoond
- Pricing is franchise-specifiek

## 🔧 Utility Functions

### Database Functions
```sql
-- Get current franchise for user
SELECT public.get_current_franchise();

-- Get franchise by slug
SELECT public.get_franchise_by_slug('pinoso');

-- Check if user is admin
SELECT public.is_admin();
```

### TypeScript Helpers
```typescript
// Franchise context hook
export const useFranchise = () => {
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  
  useEffect(() => {
    // Load current franchise
  }, [])
  
  return { franchise, setFranchise }
}

// Commission calculation
export const calculateCommission = (basePrice: number, rate: number) => {
  return basePrice * (rate / 100)
}
```

## 🧪 Testing

### Database Tests
```sql
-- Test franchise isolation
SELECT * FROM services WHERE franchise_id != 'current-franchise-id';
-- Should return empty set

-- Test commission calculation
SELECT base_price, commission_rate, final_price 
FROM services 
WHERE id = 'test-service-id';
-- Verify final_price = base_price * (1 + commission_rate/100)
```

### API Tests
```typescript
// Test franchise-scoped API
const response = await fetch('/api/services')
const services = await response.json()
// Verify all services belong to current franchise
```

## 🚨 Migratie Risico's

### 1. Data Loss
- **Risico:** Bestaande data zonder franchise_id
- **Mitigatie:** Backup voor migratie, default franchise toewijzen

### 2. API Breaking Changes
- **Risico:** Bestaande API calls werken niet meer
- **Mitigatie:** Gradual rollout, backward compatibility

### 3. Performance Impact
- **Risico:** Extra franchise_id filters
- **Mitigatie:** Proper indexing, query optimization

## 📈 Volgende Stappen

1. **Database Schema Toepassen** ✅
2. **TypeScript Types Updaten** ✅
3. **API Routes Aanpassen** 🔄
4. **UI/UX Franchise Support** ⏳
5. **Admin Module Uitbreiden** ⏳
6. **Testing & Validation** ⏳

## 📞 Support

Voor vragen over de franchise implementatie:
- Database schema: Check `supabase/franchise-schema.sql`
- TypeScript types: Check `packages/types/supabase.types.ts`
- Business rules: Zie sectie "Business Rules" hierboven 
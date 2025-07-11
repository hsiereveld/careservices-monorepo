# 🗄️ Franchise Schema Toepassing - Stap voor Stap

## 📋 Voorbereiding

### 1. **Backup maken (BELANGRIJK!)**
```sql
-- In Supabase SQL Editor uitvoeren:
CREATE TABLE profiles_backup AS SELECT * FROM profiles;
CREATE TABLE services_backup AS SELECT * FROM services;
CREATE TABLE bookings_backup AS SELECT * FROM bookings;
```

### 2. **Controleer je Supabase project**
- Ga naar [supabase.com](https://supabase.com)
- Open je project dashboard
- Ga naar **SQL Editor**

## 🚀 Schema Toepassen

### **Optie A: Via Supabase SQL Editor (Aanbevolen)**

1. **Open SQL Editor** in je Supabase dashboard
2. **Kopieer de inhoud** van `supabase/apply-franchise-schema.sql`
3. **Plak het script** in de SQL Editor
4. **Klik op "Run"** om het script uit te voeren
5. **Controleer de output** - je zou geen errors moeten zien

### **Optie B: Via Supabase CLI**

```bash
# Installeer Supabase CLI (als je het nog niet hebt)
npm install -g supabase

# Login met je Supabase account
supabase login

# Link je project
supabase link --project-ref YOUR_PROJECT_ID

# Voer het schema script uit
supabase db push --file supabase/apply-franchise-schema.sql
```

## ✅ Verificatie

Na het uitvoeren van het script, controleer of alles correct is toegepast:

### **1. Controleer nieuwe tabellen**
```sql
-- Deze query zou resultaten moeten geven:
SELECT 'franchises' as table_name, COUNT(*) as row_count FROM public.franchises
UNION ALL
SELECT 'service_categories', COUNT(*) FROM public.service_categories
UNION ALL
SELECT 'commission_requests', COUNT(*) FROM public.commission_requests;
```

### **2. Controleer franchise data**
```sql
-- Deze zou 1 rij moeten geven (Pinoso franchise):
SELECT * FROM public.franchises WHERE slug = 'pinoso';
```

### **3. Controleer service categorieën**
```sql
-- Deze zou 6 rijen moeten geven:
SELECT * FROM public.service_categories ORDER BY sort_order;
```

### **4. Controleer bestaande data**
```sql
-- Controleer of bestaande data franchise_id heeft:
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_rows,
  COUNT(franchise_id) as with_franchise_id
FROM public.profiles
UNION ALL
SELECT 
  'services',
  COUNT(*),
  COUNT(franchise_id)
FROM public.services
UNION ALL
SELECT 
  'bookings',
  COUNT(*),
  COUNT(franchise_id)
FROM public.bookings;
```

## 🔧 Troubleshooting

### **Error: "relation already exists"**
- Dit is normaal, het script gebruikt `CREATE TABLE IF NOT EXISTS`
- Je kunt deze errors negeren

### **Error: "column already exists"**
- Dit is normaal, het script controleert of kolommen bestaan
- Je kunt deze errors negeren

### **Error: "function already exists"**
- Dit is normaal, het script gebruikt `CREATE OR REPLACE FUNCTION`
- Je kunt deze errors negeren

### **Error: "policy already exists"**
- Dit is normaal, het script gebruikt `DROP POLICY IF EXISTS`
- Je kunt deze errors negeren

## 📊 Wat er is toegevoegd

### **Nieuwe Tabellen:**
- ✅ `franchises` - Franchise/regio management
- ✅ `service_categories` - Admin-gecontroleerde service categorieën
- ✅ `commission_requests` - Professional commission request workflow

### **Uitgebreide Tabellen:**
- ✅ `profiles` - Nu met `franchise_id`
- ✅ `services` - Nu met `category_id`, `franchise_id`, `base_price`, `commission_rate`, `final_price`
- ✅ `bookings` - Nu met `franchise_id`, `base_amount`, `commission_amount`
- ✅ `reviews` - Nu met `franchise_id`
- ✅ `payments` - Nu met `franchise_id`

### **Nieuwe Functies:**
- ✅ `get_current_franchise()` - Haal huidige franchise op voor gebruiker
- ✅ `get_franchise_by_slug()` - Haal franchise op via slug

### **RLS Policies:**
- ✅ Franchise-scoped policies voor alle tabellen
- ✅ Admin-only policies voor franchise management
- ✅ Professional commission request policies

## 🎯 Volgende Stappen

Na succesvolle schema toepassing:

1. **Test de API routes** - Controleer of franchise-scoped queries werken
2. **Update de booking module** - Pas de UI aan voor franchise support
3. **Test admin functionaliteit** - Controleer franchise management
4. **Voeg meer franchises toe** - Voor multi-regionale uitbreiding

## 📞 Support

Als je problemen ondervindt:

1. **Controleer de logs** in Supabase dashboard
2. **Maak een backup** van je database
3. **Test in een development project** eerst
4. **Neem contact op** als er onverwachte errors zijn 
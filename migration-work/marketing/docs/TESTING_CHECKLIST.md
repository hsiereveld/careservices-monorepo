# 🧪 TESTING CHECKLIST - FASE 1 & 2

## 🔐 **SECURITY TESTS**

### ✅ **Policy Tests**
- [ ] **User kan alleen eigen data zien**
  - Test: Login als user, probeer andere user data te benaderen
  - Verwacht: Access denied
  
- [ ] **Client kan alleen eigen bookings zien**
  - Test: Login als client, query bookings van andere client
  - Verwacht: Lege resultaten
  
- [ ] **Professional kan alleen toegewezen bookings zien**
  - Test: Login als professional, query bookings van andere professional
  - Verwacht: Alleen eigen toegewezen bookings
  
- [ ] **BackOffice kan alle data zien**
  - Test: Login als backoffice, query alle tabellen
  - Verwacht: Volledige toegang voor support
  
- [ ] **Admin kan alles beheren**
  - Test: Login als admin, CRUD operaties op alle tabellen
  - Verwacht: Volledige toegang

### ✅ **Role Assignment Tests**
- [ ] **Auto-assign client role bij booking**
  - Test: User zonder rol maakt booking
  - Verwacht: Automatisch client role toegewezen
  
- [ ] **Auto-assign professional role bij service provider**
  - Test: User wordt service provider
  - Verwacht: Automatisch professional role toegewezen
  
- [ ] **Preferences creation bij role assignment**
  - Test: Nieuwe client role
  - Verwacht: client_preferences en dashboard_settings aangemaakt

---

## 🔄 **AUTHENTICATION FLOW TESTS**

### ✅ **Registratie Tests**
- [ ] **Client registratie**
  - Test: Registreer als client
  - Verwacht: Account + profile + client role + preferences
  
- [ ] **Professional registratie**
  - Test: Registreer als professional
  - Verwacht: Account + profile + professional role + dashboard settings
  
- [ ] **Role selector werkt**
  - Test: Kies verschillende rollen tijdens registratie
  - Verwacht: Juiste rol wordt toegewezen

### ✅ **Login Redirect Tests**
- [ ] **Admin redirect**
  - Test: Login als admin
  - Verwacht: Redirect naar `/admin-dashboard`
  
- [ ] **BackOffice redirect**
  - Test: Login als backoffice
  - Verwacht: Redirect naar `/backoffice-dashboard`
  
- [ ] **Professional redirect**
  - Test: Login als professional
  - Verwacht: Redirect naar `/professional-dashboard`
  
- [ ] **Client redirect**
  - Test: Login als client
  - Verwacht: Redirect naar `/client-dashboard`
  
- [ ] **Fallback redirect**
  - Test: Login als user zonder specifieke rol
  - Verwacht: Redirect naar `/dashboard`

---

## 🎨 **UI/UX TESTS**

### ✅ **Navbar Tests**
- [ ] **Role badges tonen**
  - Test: Login met verschillende rollen
  - Verwacht: Juiste badge en icoon per rol
  
- [ ] **Menu items per rol**
  - Test: Admin vs BackOffice vs User
  - Verwacht: Verschillende menu opties
  
- [ ] **Role display name**
  - Test: Verschillende rollen
  - Verwacht: Juiste Nederlandse namen

### ✅ **Role Selector Tests**
- [ ] **Visual feedback**
  - Test: Klik op verschillende rollen
  - Verwacht: Visuele selectie feedback
  
- [ ] **Feature lists**
  - Test: Bekijk role descriptions
  - Verwacht: Relevante features per rol
  
- [ ] **BackOffice info**
  - Test: Bekijk BackOffice informatie
  - Verwacht: Duidelijke uitleg over contact opnemen

---

## 📊 **DATABASE TESTS**

### ✅ **Migration Tests**
- [ ] **Alle migraties succesvol**
  - Test: Check migration status
  - Verwacht: Geen errors in migrations
  
- [ ] **Constraints werken**
  - Test: Probeer ongeldige role toe te voegen
  - Verwacht: Constraint violation error
  
- [ ] **Triggers werken**
  - Test: Update records met updated_at
  - Verwacht: Automatische timestamp update

### ✅ **Performance Tests**
- [ ] **Index usage**
  - Test: Query plans voor belangrijke queries
  - Verwacht: Index scans, geen table scans
  
- [ ] **Function performance**
  - Test: Helper functions zoals is_admin()
  - Verwacht: Snelle response times
  
- [ ] **Policy performance**
  - Test: Queries met RLS policies
  - Verwacht: Acceptable query times

---

## 🔧 **ERROR HANDLING TESTS**

### ✅ **Authentication Errors**
- [ ] **Invalid credentials**
  - Test: Login met verkeerde gegevens
  - Verwacht: Duidelijke error message
  
- [ ] **Registration errors**
  - Test: Registreer met bestaand email
  - Verwacht: Gebruiksvriendelijke error
  
- [ ] **Role assignment errors**
  - Test: Probeer ongeldige rol toe te wijzen
  - Verwacht: Graceful error handling

### ✅ **Database Errors**
- [ ] **Connection errors**
  - Test: Database niet beschikbaar
  - Verwacht: Fallback behavior
  
- [ ] **Policy violations**
  - Test: Probeer unauthorized access
  - Verwacht: Access denied zonder data leak
  
- [ ] **Constraint violations**
  - Test: Probeer ongeldige data
  - Verwacht: Clear validation errors

---

## 🚀 **MANUAL TESTING SCENARIOS**

### **Scenario 1: Nieuwe Client**
1. Ga naar `/signup`
2. Kies "Ik zoek hulp" (Client)
3. Vul gegevens in en registreer
4. Verwacht: Redirect naar client dashboard
5. Check: client_preferences aangemaakt
6. Check: dashboard_settings aangemaakt

### **Scenario 2: Nieuwe Professional**
1. Ga naar `/signup`
2. Kies "Ik bied hulp aan" (Professional)
3. Vul gegevens in en registreer
4. Verwacht: Redirect naar professional dashboard
5. Check: dashboard_settings aangemaakt
6. Check: Geen client_preferences

### **Scenario 3: BackOffice Login**
1. Login als BackOffice user
2. Verwacht: Redirect naar `/backoffice-dashboard`
3. Check: Toegang tot alle data
4. Check: Juiste navbar met BackOffice badge
5. Check: Beperkte admin functies (geen user delete)

### **Scenario 4: Admin Login**
1. Login als Admin user
2. Verwacht: Redirect naar `/admin-dashboard`
3. Check: Volledige toegang tot alle functies
4. Check: Admin badge in navbar
5. Check: Alle admin tools beschikbaar

### **Scenario 5: Role Switching**
1. Login als user met meerdere rollen
2. Check: Primary role wordt gebruikt voor redirect
3. Check: Alle rollen zichtbaar in profiel
4. Check: Juiste permissions per context

---

## ✅ **AUTOMATED TESTING COMMANDS**

```bash
# Database connectivity test
npm run test:db

# Authentication flow test
npm run test:auth

# Policy test suite
npm run test:policies

# UI component tests
npm run test:components

# Integration tests
npm run test:integration

# Performance tests
npm run test:performance
```

---

## 📋 **SIGN-OFF CRITERIA**

### **✅ FASE 1 COMPLETE WHEN:**
- [ ] All database migrations successful
- [ ] All RLS policies working correctly
- [ ] No policy recursion errors
- [ ] All helper functions working
- [ ] Performance benchmarks met

### **✅ FASE 2 COMPLETE WHEN:**
- [ ] Role-based registration working
- [ ] Login redirects working correctly
- [ ] UI components rendering properly
- [ ] Error handling working
- [ ] All manual scenarios pass

### **🚀 READY FOR FASE 3 WHEN:**
- [ ] All Fase 1 criteria met
- [ ] All Fase 2 criteria met
- [ ] Security audit passed
- [ ] Performance tests passed
- [ ] Manual testing completed
- [ ] No critical bugs remaining

**STATUS: ✅ READY FOR FASE 3**
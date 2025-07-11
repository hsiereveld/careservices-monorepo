# TaskFlow - Task Management App

Een moderne task management applicatie gebouwd met React, TypeScript, Tailwind CSS en Supabase.

## Features

- 🔐 Gebruikersauthenticatie (registratie/login)
- ✅ CRUD operaties voor taken
- 🎯 Prioriteiten systeem (laag, gemiddeld, hoog)
- 📱 Responsive design
- 🎨 Moderne UI met glassmorphism effecten
- 🔒 Row Level Security (RLS) voor data beveiliging

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Authentication, Real-time)
- **Icons:** Lucide React
- **Routing:** React Router DOM
- **Build Tool:** Vite

## Lokale Development

1. Clone de repository:
```bash
git clone [jouw-repo-url]
cd taskflow-app
```

2. Installeer dependencies:
```bash
npm install
```

3. Setup environment variabelen:
```bash
cp .env.example .env
```
Vul je Supabase credentials in.

4. Start de development server:
```bash
npm run dev
```

## Deployment

Deze app is geconfigureerd voor automatische deployment via Netlify wanneer er wijzigingen worden gepusht naar de main branch.

## Database Schema

De app gebruikt een `tasks` tabel met de volgende structuur:
- `id` (uuid, primary key)
- `title` (text, required)
- `description` (text, optional)
- `completed` (boolean, default: false)
- `priority` (text, enum: 'low'|'medium'|'high')
- `user_id` (uuid, foreign key)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je wijzigingen (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request# CS-admin
# CS-admin
# CS-admin

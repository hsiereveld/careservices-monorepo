# Care & Service Admin Dashboard

Admin dashboard for the Care & Service platform, designed for managing services, users, and bookings for Dutch/Belgian expats in Spain.

## Features

- 🔐 User authentication with role-based access
- 👥 User management with role assignment
- 🛠️ Service and category management
- 📅 Booking management system
- 💰 Invoicing and payment processing
- 📊 Admin dashboard with analytics
- 🌐 Multi-language support (Dutch primary)

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Authentication, Storage)
- **State Management:** React Context API
- **UI Components:** Custom components with Lucide React icons
- **Routing:** React Router DOM
- **Build Tool:** Vite

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Add your Supabase credentials to the `.env` file.

4. Start the development server:
```bash
npm run dev
```

## Deployment

The application is deployed to Netlify and can be accessed at [admin.careservice.es](https://admin.careservice.es).
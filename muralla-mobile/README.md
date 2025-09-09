# Muralla Mobile - Independent Mobile Frontend

A separate mobile-optimized web frontend for the Muralla task management system, designed specifically for mobile devices and deployed independently at `admincelu.murallacafe.cl`.

## Features

- **Mobile-First Design**: Touch-friendly interface optimized for phones and tablets
- **Task Management**: Create, edit, and manage tasks with mobile-optimized modals
- **Real-time Updates**: Optimistic UI updates with API synchronization
- **Authentication**: Secure login with JWT token management
- **Responsive**: Works across different mobile screen sizes
- **Independent Deployment**: Completely separate from desktop frontend

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Axios** for API calls
- **Heroicons** for icons

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env.local` file with:

```
VITE_API_BASE_URL=https://muralla-backend.onrender.com/api
```

## Deployment

This app is configured for independent deployment on multiple platforms:

### Render (Primary - admincelu.murallacafe.cl)
- Uses `render.yaml` configuration
- Automatic deployments from git
- Custom domain: `admincelu.murallacafe.cl`

### Netlify (Alternative)
- Uses `netlify.toml` configuration
- SPA redirects configured

### Vercel (Alternative)
- Uses `vercel.json` configuration
- Automatic deployments

## API Integration

The mobile app connects to the same backend API as the desktop version but with mobile-optimized data handling:

- **Authentication**: JWT tokens stored in localStorage
- **Tasks**: CRUD operations with optimistic updates
- **Projects**: Project selection and management
- **Real-time**: Automatic data synchronization

## Mobile-Specific Features

- **Touch-friendly UI**: Large tap targets and swipe gestures
- **Modal interfaces**: Full-screen modals for forms
- **Optimized performance**: Minimal bundle size and fast loading
- **Offline-ready**: Service worker support (planned)

## Architecture

```
src/
├── components/
│   ├── tasks/           # Task management components
│   │   ├── TaskCard.tsx
│   │   ├── TaskModal.tsx
│   │   └── MobileTasksList.tsx
│   └── ui/              # Reusable UI components
├── services/            # API services
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── App.tsx              # Main app component
```

## Deployment Status

- **Development**: `http://localhost:5174`
- **Production**: `https://admincelu.murallacafe.cl` (configured)

## Independent from Desktop

This mobile frontend is completely independent from the desktop version:
- Separate codebase and deployment
- Shared backend API only
- No dependencies on desktop frontend
- Can be updated and deployed independently

# Care Collective Preview

A simplified, client-ready preview of the Care Collective platform, combining the best features from versions 1-10.

## Overview

This preview app demonstrates the core functionality of the Care Collective platform:
- User authentication (signup/login)
- Dashboard with community overview
- Help request creation and browsing
- Read-only admin panel for community management
- Design system showcase

## Features

### Public Pages
- **Landing Page**: Overview and preview instructions
- **Login/Signup**: Authentication flows
- **Design System**: Colors and typography showcase

### Authenticated Pages
- **Dashboard**: Personalized user dashboard
- **Requests**: Browse and create help requests
- **Admin Panel**: Read-only community management (preview mode)

### API Endpoints
- `/api/health`: Health check endpoint
- `/api/auth/logout`: User logout

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Custom components with Radix UI primitives
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Navigate to the preview directory:
   ```bash
   cd care-collective-preview
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_SITE_URL`: Your site URL (for redirects)

Optional variables:
- `SUPABASE_SERVICE_ROLE`: Service role key (for admin features)
- `NEXT_PUBLIC_PREVIEW_ADMIN`: Enable admin panel (set to "1")
- `NEXT_PUBLIC_ADMIN_ALLOWLIST`: Comma-separated list of admin emails

## Database Schema

The app uses a simplified schema based on v9:

### Tables
- `profiles`: User profiles
- `help_requests`: Community help requests
- `messages`: User messages (future use)

See `DATABASE_MANAGEMENT.md` for detailed schema and management instructions.

## Deployment

### Vercel Deployment

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set project root to `care-collective-preview`
4. Configure environment variables
5. Deploy

See `VERCEL_DEPLOYMENT.md` for detailed deployment instructions.

## Project Structure

```
care-collective-preview/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin panel (read-only)
│   ├── api/               # API routes
│   ├── design-system/     # Design system showcase
│   └── requests/          # Help request pages
├── components/            # Reusable UI components
├── lib/                   # Utility functions and Supabase clients
├── public/                # Static assets
└── docs/                  # Documentation
```

## Key Features

### Authentication
- Supabase-powered signup/login
- Email confirmation
- Protected routes with middleware
- Automatic redirects

### Help Requests
- Create requests with categories and urgency levels
- Browse community requests
- Real-time data from Supabase

### Admin Panel
- Read-only preview mode
- User management overview
- Help request moderation interface
- System statistics

### Design System
- Custom Tailwind configuration
- Overlock font family
- Warm, accessible color palette
- Consistent component library

## Development

### Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind for styling
- Component-based architecture

## Testing

### Manual Testing Checklist
- [ ] Signup flow works
- [ ] Login/logout works
- [ ] Dashboard loads for authenticated users
- [ ] Request creation works
- [ ] Request browsing works
- [ ] Admin panel loads (read-only)
- [ ] Design system pages display correctly
- [ ] Health endpoint returns success

## Contributing

This is a preview build for client demonstration. For production development, refer to the main project repository.

## Documentation

- `VERCEL_DEPLOYMENT.md`: Deployment instructions
- `DATABASE_MANAGEMENT.md`: Database management and seeding
- `care-collective-preview-plan.md`: Original implementation plan

## Support

For technical issues or questions about this preview, refer to the project documentation or contact the development team.

## License

This project is part of the Care Collective platform. All rights reserved.
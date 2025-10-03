# GateFlow - Digital Gatepass Management System

A modern, real-time gatepass management system for educational institutions built with Next.js and Supabase.

## Features

- **Student Request Submission** - Students can submit gatepass requests with destination, purpose, and timing details
- **Parent Approval System** - Parents receive unique approval links to approve/reject requests
- **Real-time Dashboard** - Wardens and security can view all requests with live updates
- **Status Tracking** - Track requests through multiple approval stages
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables in `.env.local`:
   \`\`\`bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   \`\`\`

4. Run the SQL migration in your Supabase SQL Editor:
   - Execute `supabase/schema.sql` to create tables
   - Execute `supabase/002-fix-rls-policies.sql` to set up security policies

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Open [http://localhost:3000](http://localhost:3000)

## Database Setup

The application requires two SQL files to be executed in your Supabase project:

1. **schema.sql** - Creates the main tables and functions
2. **002-fix-rls-policies.sql** - Sets up Row Level Security policies

Run these in order through the Supabase SQL Editor.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

Make sure to update `NEXT_PUBLIC_APP_URL` to your production URL after deployment.

## Project Structure

\`\`\`
├── app/
│   ├── actions/          # Server actions
│   ├── dashboard/        # Warden dashboard
│   ├── parent-approval/  # Parent approval pages
│   └── page.tsx          # Student request form
├── components/
│   ├── ui/              # Reusable UI components
│   ├── navbar.tsx       # Navigation bar
│   └── footer.tsx       # Footer
├── lib/
│   ├── supabase/        # Supabase client setup
│   └── types.ts         # TypeScript types
└── supabase/            # Database schemas
\`\`\`

## Workflow

1. **Student submits request** → Form on homepage
2. **Data stored in database** → Real-time update
3. **Parent receives approval link** → Via email or manual sharing
4. **Parent approves/rejects** → Updates status in database
5. **Warden views dashboard** → Sees all requests with current status
6. **Security checks dashboard** → Verifies approved gatepasses

## Build for Production

\`\`\`bash
npm run build
\`\`\`

This will check for TypeScript errors and build the production-ready application.

## License

MIT

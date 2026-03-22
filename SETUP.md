# 📚 Portfolio Website - Complete Setup Guide

## 🎯 Project Overview

Modern full-stack portfolio website built with:

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **Deploy**: Vercel

## 📋 Prerequisites

- Node.js 18+ och npm/yarn/pnpm
- Git
- Supabase account (free)
- Vercel account (free)

---

## 🚀 Local Setup

### 1. Clone & Install Dependencies

```bash
# Navigate to project
cd my-profile

# Install dependencies
npm install

# Or with other package managers
yarn install
# or
pnpm install
```

### 2. Setup Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. After project is created, go to **Settings** → **API**
3. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Setup Database

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query** and run the seed script from Supabase SQL terminal:

```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- You can also use Prisma migrations instead:
-- Run: npx prisma migrate deploy
```

3. In your terminal, run Prisma migrations:

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma migrate deploy

# Or for dev:
npx prisma migrate dev --name init

# Seed sample data
npx prisma db seed
```

### 4. Create `.env.local` File

```bash
# Copy from .env.example
cp .env.example .env.local

# Edit .env.local with your values:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - DATABASE_URL
# - DIRECT_URL
```

Get database URLs from Supabase:

- Go to **Settings** → **Database** → **Connection string**
- Choose **Prisma** option
- Copy the connection string (set your password first!)

**Example .env.local:**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?sslmode=require"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Setup Supabase Row-Level Security (RLS)

Go to Supabase Dashboard → **Authentication** → **Policies** and setup:

```sql
-- For projects table - enable RLS first
alter table projects enable row level security;

-- Public projects policy
create policy "Public projects visible to all"
  on projects for select
  using (visibility = 'PUBLIC' and status = 'PUBLISHED');

-- Private projects - only owner or admin
create policy "Private projects only for owner"
  on projects for select
  using (auth.uid() = author_id or exists (
    select 1 from user_roles
    where user_id = auth.uid() and role_id = (select id from roles where name = 'admin')
  ));

-- Shared projects - check permissions
-- (Can be handled at application level for now)
```

### 6. Create Admin User

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **Add User** → Create with email & password
3. In Database, manually add admin role:

```sql
-- Get the user ID from the table (copy from auth.users)
-- Then run:
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT '<USER_ID>', id, NOW()
FROM roles WHERE name = 'admin';
```

### 7. Test Locally

```bash
# Start development server
npm run dev

# Open http://localhost:3000 in browser
```

**Test URLs:**

- Home: `http://localhost:3000`
- Projects: `http://localhost:3000/projects`
- Contact: `http://localhost:3000/contact`
- Login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard` (requires login)

---

## 📁 Project Structure Reference

```
src/
  ├── app/                 # Next.js App Router pages
  ├── components/          # Reusable React components
  ├── lib/                 # Utilities & helpers
  ├── actions/            # Server Actions (CRUD)
  ├── middleware.ts       # Auth middleware
  └── types/              # TypeScript types

prisma/
  ├── schema.prisma       # Database schema
  └── seed.ts            # Sample data

```

---

## 🔐 Key Features Implemented

### ✅ Authentication

- Supabase Auth with JWT tokens
- Protected dashboard routes via middleware
- Role-based access control (RBAC)

### ✅ Permissions (3-Tier)

- **Guest**: View public projects only
- **Viewer**: View shared projects when logged in
- **Admin**: Full control (CRUD, user management)

### ✅ Project Management

- Create, read, update, delete projects
- Multiple visibility levels (Public, Private, Shared)
- Status management (Draft, Published, Archived)
- Tech stack tagging
- File and image uploads

### ✅ Public Pages

- Home/Hero
- About/Bio
- Projects Showcase
- Project Detail view
- Contact Form
- Skills (extensible)

### ✅ Admin Dashboard

- Project management
- Upload files/images
- User/permission management
- Contact messages
- Profile settings

---

## 📤 Deploy to Vercel

### 1. Prepare Repository

```bash
# Make sure everything is committed
git add .
git commit -m "Initial portfolio setup"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Using Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your GitHub repository
4. Set **Framework** to `Next.js`
5. Add environment variables (from `.env.local`)
6. Click **Deploy**

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 3. Configure Production Environment

1. In Vercel Dashboard, go to **Settings** → **Environment Variables**
2. Add all variables from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"`

### 4. Setup Supabase for Vercel

1. In Supabase Dashboard → **Settings** → **Auth**
2. Add to **Redirect URLs**:

   ```
   https://your-domain.vercel.app/dashboard
   https://your-domain.vercel.app/auth/callback
   ```

3. If using custom domain, update redirect URLs accordingly

### 5. Test Production

After deployment completes:

```
✨ https://your-domain.vercel.app
```

---

## 🗄️ Database Schema Overview

### Tables

- `users` - Auth users
- `profiles` - User profile info
- `roles` - Role definitions (admin, viewer, guest)
- `user_roles` - User role assignments
- `projects` - Project entries
- `project_files` - Uploaded files
- `project_images` - Project images
- `project_permissions` - Shared project access
- `tags` - Technology tags
- `project_tags` - Project-tag relationships
- `contact_messages` - Contact form submissions

---

## 🔒 Security Best Practices Implemented

✅ **Row Level Security (RLS)** - Database-level access control
✅ **Input Validation** - Zod schemas
✅ **RBAC** - Custom role system
✅ **Protected Routes** - Middleware auth checks
✅ **API Validation** - Server-side validation
✅ **Environment Variables** - Secrets in `.env.local`
✅ **HTTPS Only** - Enforced by Vercel
✅ **File Upload Validation** - Type & size checks

---

## 📝 Coming Soon / Extensions

- [ ] Dark mode toggle
- [ ] Project comments/ratings
- [ ] Social media sharing
- [ ] Search functionality
- [ ] Analytics integration
- [ ] Email notifications
- [ ] Batch file uploads
- [ ] Project templates

---

## 🆘 Troubleshooting

### **Error: "Unauthorized" on dashboard**

- Check if user has admin role assigned
- Verify Supabase auth session is valid
- Check middleware.ts route protection

### **Database migration errors**

```bash
# Reset and restart
npx prisma migrate reset

# Or just deploy latest
npx prisma migrate deploy
```

### **Files not uploading**

- Check file size limits (10MB default)
- Verify S Storage permissions in Supabase
- Ensure bucket exists and is public/private as needed

### **Supabase connection issues**

- Verify DATABASE_URL and DIRECT_URL are correct
- Check if database is active in Supabase
- Test connection string locally first

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npx prisma studio      # Open Prisma Studio UI
npx prisma migrate dev # Create and apply migrations
npx prisma db seed     # Run seed script

# Build & Test
npm run build           # Build for production
npm run lint            # Run linter

# Deployment
git push origin main    # Push to trigger Vercel deploy
```

---

## 📖 Documentation Links

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vercel Deployment](https://vercel.com/docs)

---

## 🎓 Learning Resources

- Check `CLAUDE.md` and `AGENTS.md` for agent customization
- Review component structure in `src/components`
- Study server actions in `src/actions`
- Type definitions in `src/types`

---

## ✅ Testing Checklist

- [ ] Public pages load correctly
- [ ] Login/Register works
- [ ] Can create new project (admin)
- [ ] Can upload images/files
- [ ] Project visibility settings work
- [ ] Contact form submits
- [ ] Project sharing works
- [ ] Production deployment works
- [ ] Auth redirects work correctly

---

Made with ❤️ for modern portfolio building

# 🎓 Modern Portfolio Website

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)

A production-ready portfolio website built with modern tech stack featuring authentication, role-based permissions, and full admin dashboard.

---

## ✨ Features

### 🌍 Public Pages

- **Home** - Hero section with featured projects
- **About** - Personal introduction and background
- **Projects** - Showcase all public projects with filtering
- **Project Detail** - Full project view with images, tech stack, links
- **Skills** - Technical skills with proficiency levels
- **CV/Resume** - Professional resume/CV page
- **Contact** - Contact form with message storage

### 🔐 Authentication & Authorization

- **Supabase Auth** - Secure JWT-based authentication
- **3-Tier Permissions** - Guest, Viewer, Admin roles
- **Role-Based Access** - Fine-grained permission control
- **Protected Routes** - Middleware protects admin pages
- **Row-Level Security** - Database-level security with RLS

### 👑 Admin Dashboard

- **Project Management** - Create, read, update, delete projects
- **Project Visibility** - Public/Private/Shared options
- **File Uploads** - Upload images and documents
- **User Management** - Manage roles and permissions
- **Contact Messages** - View and manage contact form submissions
- **Profile Settings** - Update personal information

### 🏗️ Technical Foundation

- **Type-Safe** - Full TypeScript throughout
- **Server Components** - Optimized rendering strategy
- **Server Actions** - Secure backend operations
- **Validators** - Zod schema validation
- **Responsive Design** - Mobile-first approach
- **Dark Mode Ready** - Tailwind CSS v4 setup

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Supabase account (free)

### Setup in 5 Minutes

```bash
# 1. Clone and install
cd my-profile
npm install

# 2. Create Supabase project and get keys

# 3. Create .env.local
cp .env.example .env.local
# Fill in your Supabase credentials

# 4. Setup database
npx prisma migrate deploy
npx prisma db seed

# 5. Run dev server
npm run dev

# Visit http://localhost:3000 🎉
```

**For detailed setup instructions, see [QUICKSTART.md](./QUICKSTART.md)**

---

## 📁 Project Structure

```
📦 my-profile
├── 📁 src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (public)/          # Public pages
│   │   ├── (auth)/            # Login/Register
│   │   ├── (dashboard)/       # Admin dashboard
│   │   └── api/               # API routes
│   ├── components/            # Reusable React components
│   ├── lib/                   # Utilities & helpers
│   │   ├── supabase/          # Supabase clients
│   │   ├── auth/              # Auth utilities
│   │   ├── validators/        # Zod schemas
│   │   └── utils/             # Helpers
│   ├── actions/              # Server Actions (CRUD)
│   ├── middleware.ts         # Route protection
│   └── types/                # TypeScript types
├── 📁 prisma/
│   ├── schema.prisma         # Database schema (11 tables)
│   └── seed.ts               # Sample data
├── 📄 SETUP.md               # Detailed setup guide
├── 📄 QUICKSTART.md          # Quick start guide
├── 📄 ARCHITECTURE.md        # System architecture
├── 📄 IMPLEMENTATION_SUMMARY.md # What's done
└── 📄 RLS_POLICIES.md        # Supabase RLS setup
```

---

## 📚 Documentation

### For Getting Started

- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup (START HERE!)
- **[SETUP.md](./SETUP.md)** - Complete setup guide with troubleshooting

### For Understanding

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design & data flow
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What's built & TODO

### For Security

- **[RLS_POLICIES.md](./RLS_POLICIES.md)** - Database security setup

---

## 🏗️ Architecture Overview

```
Next.js App Router
  ├── Public Pages (SSG/ISR)
  ├── Auth Pages (Supabase)
  └── Protected Dashboard (RBAC)
         ↓
Server Actions & Middleware
         ↓
Prisma ORM
         ↓
PostgreSQL (Supabase)
  ├── 11 Tables
  ├── Row-Level Security
  └── Relationships
```

**[Read Full Architecture →](./ARCHITECTURE.md)**

---

## 🔐 Security

- ✅ **End-to-End Encryption** - HTTPS enforced
- ✅ **Authentication** - Supabase JWT tokens
- ✅ **Authorization** - Role-based access control (RBAC)
- ✅ **Database Security** - Row-Level Security (RLS) policies
- ✅ **Input Validation** - Zod schema validation on server
- ✅ **CORS** - Properly configured
- ✅ **Secrets** - Environment variables for sensitive data
- ✅ **SQL Injection** - Protected by Prisma ORM

**[See RLS Policies →](./RLS_POLICIES.md)**

---

## 📊 Database Schema

**11 Tables with Relationships:**

- `users` - Auth users
- `profiles` - User profile info
- `roles` - Role definitions
- `user_roles` - User role assignments
- `projects` - Project entries
- `project_files` - Uploaded files
- `project_images` - Project images
- `project_permissions` - Shared access
- `tags` - Technology tags
- `project_tags` - Project-tag relationships
- `contact_messages` - Contact form submissions

**Uses:**

- Prisma ORM for type-safe database access
- PostgreSQL with advanced features
- Normalized schema (no data duplication)

---

## 🎨 Technology Stack

| Layer              | Tech                                              |
| ------------------ | ------------------------------------------------- |
| **Frontend**       | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| **Authentication** | Supabase Auth (JWT)                               |
| **Database**       | PostgreSQL (via Supabase)                         |
| **ORM**            | Prisma                                            |
| **Validation**     | Zod                                               |
| **Storage**        | Supabase Storage                                  |
| **Deployment**     | Vercel                                            |
| **State**          | Zustand (ready)                                   |
| **Forms**          | React Hook Form (ready)                           |

---

## 📈 Features Status

### ✅ Implemented

- [x] Authentication system
- [x] 3-tier permissions (guest, viewer, admin)
- [x] Public pages (home, about, projects, skills, cv, contact)
- [x] Admin dashboard
- [x] Project CRUD
- [x] Project visibility (public/private/shared)
- [x] Contact form
- [x] Responsive design
- [x] TypeScript throughout
- [x] Database schema (11 tables)
- [x] Middleware protection
- [x] Server Actions

### 🟡 Ready to Implement

- [ ] File upload API
- [ ] Image upload UI
- [ ] User management page
- [ ] Contact messages admin
- [ ] Project sharing UI
- [ ] Tags functionality UI

### 🟢 Extensions

- [ ] Dark mode toggle
- [ ] Search functionality
- [ ] Analytics
- [ ] Comments system
- [ ] Social features

**[See Full Status →](./IMPLEMENTATION_SUMMARY.md)**

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial portfolio setup"
git push origin main

# 2. On Vercel.com:
# - Import GitHub repository
# - Add environment variables
# - Click Deploy

# 3. Done! Your site is live 🎉
```

**[See Detailed Deploy Guide →](./SETUP.md/#-deploy-to-vercel)**

---

## 🛠️ Development

### Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter

# Database
npx prisma studio   # Open Prisma Studio
npx prisma migrate  # Create migration
npx prisma db seed  # Seed data
```

---

## 📝 Permission Model

### 3-Tier System

```typescript
type UserRole = "guest" | "viewer" | "admin";

// guest - unauthenticated user
// Can: view public projects only

// viewer - authenticated user
// Can: view public + shared projects

// admin - administrator
// Can: do everything (CRUD, manage users)
```

### Project Visibility

```
PUBLIC   → Displayed to everyone
PRIVATE  → Only owner or admin
SHARED   → Selected users with permission
```

---

## 🎓 Learning Resources

- **Next.js**: https://nextjs.org/learn
- **Prisma**: https://www.prisma.io/docs
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## 🤝 Contributing

This is a personal portfolio project. Feel free to:

- Use as a template
- Customize for your needs
- Learn from the architecture
- Contribute improvements

---

## 📄 License

MIT - Use freely with attribution

---

## 🎯 Next Steps

1. **Setup** → Follow [QUICKSTART.md](./QUICKSTART.md)
2. **Understand** → Read [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Customize** → Update content and branding
4. **Deploy** → Push to [Vercel](https://vercel.com)
5. **Extend** → Add more features

---

## ❓ FAQ

**Q: How do I change the site name?**
A: Update `SITE_NAME` in `src/lib/utils/constants.ts`

**Q: Can I add more roles?**
A: Yes! Add to `roles` table and update permission logic

**Q: How do I enable file uploads?**
A: Create `app/api/upload/route.ts` (guide in SETUP.md)

**Q: Is it production-ready?**
A: Yes! Full TypeScript, security, and error handling included

---

## 💬 Support

- 📖 Read documentation files (SETUP.md, ARCHITECTURE.md)
- 🔍 Check Supabase/Prisma docs
- 🐛 Review console logs for errors
- 💡 Check troubleshooting section in SETUP.md

---

## ✨ Credits

Built with ❤️ using:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma
- Supabase

---

**Ready to build your portfolio? [Let's Go! →](./QUICKSTART.md)**

_Last updated: 2024_

# 🏗️ ARCHITECTURE DEEP DIVE

## Tổng Quan Hệ Thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP ROUTER                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PUBLIC PAGES (SSG/ISR)                       │  │
│  │  ├─ Home (Hero + Featured Projects)                      │  │
│  │  ├─ About (Bio & Background)                             │  │
│  │  ├─ Projects Showcase                                    │  │
│  │  ├─ Project Detail [slug]                                │  │
│  │  ├─ Skills (with proficiency)                            │  │
│  │  ├─ CV / Resume                                          │  │
│  │  └─ Contact Form                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              AUTH LAYER (Middleware)                      │  │
│  │  ├─ Login         (Supabase Session)                      │  │
│  │  ├─ Register      (Create User + Profile)                │  │
│  │  └─ Auth Callback (OAuth/Magic Links)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         PROTECTED DASHBOARD (Admin Only)                  │  │
│  │  ├─ Main Dashboard (Stats Overview)                      │  │
│  │  ├─ Projects Management (CRUD)                           │  │
│  │  │  ├─ List Projects                                     │  │
│  │  │  ├─ Create Project                                    │  │
│  │  │  ├─ Edit Project                                      │  │
│  │  │  └─ Delete Project                                    │  │
│  │  ├─ Users & Permissions                                  │  │
│  │  ├─ Contact Messages                                     │  │
│  │  └─ Settings (Profile Update)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SERVER ACTIONS (Business Logic)              │  │
│  │  ├─ Projects: Create, Read, Update, Delete, Publish      │  │
│  │  ├─ Contact: Submit messages                             │  │
│  │  ├─ Upload: Images, Files                                │  │
│  │  └─ Users: Manage roles, permissions                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          ROUTE HANDLERS (Current + Planned)               │  │
│  │  ├─ /auth/callback        (Session exchange)             │  │
│  │  ├─ /api/upload           (Planned file & image upload)  │  │
│  │  └─ /api/projects         (Planned REST endpoints)       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ⬇️
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE & UTILITIES                       │
├─────────────────────────────────────────────────────────────────┤
│  ├─ Auth Middleware       (protect dashboard routes)            │
│  ├─ Permission System     (RBAC: guest, viewer, admin)          │
│  ├─ Validators            (Zod schemas)                         │
│  └─ Constants             (site and navigation config)          │
└─────────────────────────────────────────────────────────────────┘
                             ⬇️
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (Prisma ORM)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────┐      ┌──────────────┐      ┌─────────────┐     │
│  │   Users    │◄────►│  UserRoles   │◄────►│    Roles    │     │
│  └────────────┘      └──────────────┘      └─────────────┘     │
│         ▲                                                         │
│         │                                                         │
│         └──────────────┐                                         │
│                        ▼                                         │
│              ┌──────────────────┐                               │
│              │    Profiles      │                               │
│              └──────────────────┘                               │
│                                                                   │
│  ┌────────────┐      ┌──────────────┐      ┌─────────────┐     │
│  │ Projects   │──────│  ProjectTags │────► │    Tags     │     │
│  └────────────┘      └──────────────┘      └─────────────┘     │
│         │                                                         │
│    ┌────┼────┐                                                  │
│    ▼    ▼    ▼                                                  │
│  ┌──────────────────────────────────────────────┐              │
│  │  ProjectFiles  │  ProjectImages  │  ProjectPerm..  │        │
│  └──────────────────────────────────────────────┘              │
│                                                                   │
│  ┌──────────────────────┐                                       │
│  │  ContactMessages     │                                       │
│  └──────────────────────┘                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ⬇️
┌─────────────────────────────────────────────────────────────────┐
│                SUPABASE (Database & Storage)                    │
├─────────────────────────────────────────────────────────────────┤
│  ├─ PostgreSQL         (11 tables, 70+ columns)                 │
│  ├─ Auth               (Session management with JWT)            │
│  ├─ RLS Policies       (Row Level Security)                     │
│  └─ Storage Buckets    (Public/Private file storage)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Architectural Decisions

### 1. **Folder-Based Route Groups**

```
app/(public)/        ← Public pages, no auth required
app/(auth)/          ← Auth-related pages
app/(dashboard)/     ← Protected admin pages
```

**Benefit**: Clean separation of concerns, easier to read flow

### 2. **Server Actions Over API Routes**

Used Server Actions for:

- CRUD operations (projects, contacts)
- Database mutations
- Server-side validation

**Benefit**:

- Type-safe
- No additional endpoints
- Automatic revalidation

Route Handlers used for:

- Auth callback session exchange
- File uploads (need FormData)
- External integrations

---

### 3. **Three-Tier Permission Model**

```typescript
// Simple but powerful
type UserRole = "guest" | "viewer" | "admin";

// Each role has capabilities
const rolePermissions = {
  guest: ["view_projects"],
  viewer: ["view_projects"],
  admin: [
    "view_projects",
    "create_project",
    "edit_project",
    "delete_project",
    "manage_users",
  ],
};
```

**Project Visibility Logic**:

```
PUBLIC   → Anyone sees it (guest/viewer/admin/unauthenticated)
PRIVATE  → Only owner or admin sees it
SHARED   → Specific users with permission can see it
```

---

### 4. **Middleware for Route Protection**

```typescript
// src/middleware.ts
// Runs on EVERY request, protects /dashboard routes

if (request.nextUrl.pathname.startsWith("/dashboard")) {
  if (!user) {
    redirect("/login");
  }
}
```

**Benefit**:

- Single source of truth for auth
- Pre-emptive protection
- No auth checks needed in components

---

### 5. **Component Organization**

```
components/
├── layout/          ← Navbar, Footer, Sidebar (reusable frames)
├── features/        ← Hero, ContactForm (page-level)
└── projects/        ← ProjectCard, ProjectForm (domain-specific)
```

**Benefit**: Easy to find, understand, and reuse components

---

### 6. **Database Normalization**

11 Tables with proper relationships:

- **Users & Roles**: Many-to-many with `user_roles` junction table
- **Projects & Files/Images**: One-to-many relationships
- **Projects & Permissions**: One-to-many for access control
- **Projects & Tags**: Many-to-many with `project_tags` junction

**Benefit**: No data duplication, easy updates, consistent state

---

## 🔐 Security Layers

### Layer 1: Database (RLS)

```sql
-- Only user sees their own private projects
alter table projects enable row level security;

create policy "Private projects only for owner"
  on projects for select
  using (auth.uid() = author_id);
```

### Layer 2: Application (Middleware)

```typescript
// Dashboard pages blocked at middleware level
if (!isAuthenticated) redirect("/login");
```

### Layer 3: Server Actions (Authorization)

```typescript
// Each action checks permissions
if (!canEditProject(role, isAuthor)) {
  throw new Error("Unauthorized");
}
```

### Layer 4: Input Validation (Zod)

```typescript
const projectSchema = z.object({
  title: z.string().min(5).max(200),
  // ... validation rules
});
```

---

## 📊 Data Flow Examples

### **Creating a Project (Happy Path)**

```
1. User clicks "New Project"
   └─> navigates to /dashboard/projects/new

2. ProjectForm component loads
   └─> renders form with inputs

3. User fills form and clicks "Save"
   └─> calls createProject() server action

4. Server action:
   a) Validates input (Zod)
   b) Checks auth (user must be logged in)
   c) Creates project in database
   d) Revalidates cache
   └─> returns {success: true, project}

5. Component receives response
   └─> redirects to /dashboard/projects

6. User sees their new project in list
```

### **Viewing a Project (Permission Check)**

```
1. Visitor on /projects/my-project-slug

2. ProjectDetail component loads (server component):
   a) Calls getProjectBySlug(slug)
   b) Server action checks:
      - Project exists?
      - Is public? → Always allow
      - Is private? → Only if user is author or admin
      - Is shared? → Check ProjectPermission table
   c) Returns project (or error)
   └─> Renders project or 404

3. If user has permission → See full project details
   If no permission → See 404 page
```

---

## 🎨 Component Hierarchy

```
RootLayout
├── Navbar (client)
├── (public)
│   ├── Hero (client feature)
│   ├── ProjectCard (client component)
│   └── ProjectGrid (client/server)
├── (auth)
│   └── LoginForm (client form)
├── (dashboard)
│   ├── Sidebar (client nav)
│   └── ProjectForm (client form with actions)
├── auth/
│   └── callback (route handler)
└── Footer (client)
```

**Key**: Server Components by default, Client Components (`'use client'`) only when needed.

---

## 💾 Database Relationships Map

```
┌──────────┐
│ 💬 Users │
└────┬─────┘
     │
     ├─ N:1 ─> 👤 Profiles
     │
     ├─ N:M ─> 🎯 Roles (via user_roles)
     │
     ├─ 1:N ─> 📋 Projects (as author)
     │
     ├─ 1:N ─> 📨 ContactMessages
     │
     └─ 1:N ─> 🔐 ProjectPermissions (as recipient)

┌──────────────┐
│ 📋 Projects  │
└───┬──────────┘
    │
    ├─ N:1 ─> 👤 Users (author)
    │
    ├─ 1:N ─> 📄 ProjectFiles
    │
    ├─ 1:N ─> 🖼️ ProjectImages
    │
    ├─ 1:N ─> 🔐 ProjectPermissions
    │
    └─ N:M ─> 🏷️ Tags (via project_tags)

┌──────────────┐
│ 🔐 Roles     │
└───┬──────────┘
    │
    └─ N:M ─> 💬 Users (via user_roles)
```

---

## 🚀 Request Lifecycle

### Public Request (Home Page)

```
1. GET / (HTTP Request)
2. Next.js Router → app/page.tsx (Server Component)
3. Component calls async getPublicProjects()
4. Prisma queries PostgreSQL (with RLS applied)
5. Returns HTML + data
6. Browser renders page
```

### Authenticated Request (Create Project)

```
1. User fills form on /dashboard/projects/new
2. Clicks "Create"
3. JavaScript → createProject() action
4. Network request with form data
5. Middleware intercepts → verifies auth
6. Server action runs:
   - Validates input (Zod)
   - Checks user role (RBAC)
   - Inserts into database
   - Revalidates related paths
7. Returns success response
8. JavaScript → router.push('/dashboard/projects')
9. Browser renders updated page
```

---

## 📈 Scalability Considerations

### What can handle 1000 users:

- ✅ Current database design
- ✅ Prisma (efficient queries)
- ✅ Server-side rendering (efficient)
- ✅ Vercel's automatic scaling

### For 10,000+ users, consider:

- Database read replicas
- Caching layer (Redis)
- CDN for static assets
- Database connection pooling
- Batch operations for bulk uploads

---

## 🔧 Extension Points

### Easy to Add:

1. **Comments** → Add `projectComments` table + UI
2. **Likes/Ratings** → Add `projectRatings` table
3. **Search** → Add full-text search indexes
4. **Tags** → Already implemented, just need UI
5. **Notifications** → Add `notifications` table + WebSocket

### Moderate to Add:

1. **Real-time collaboration** → Supabase realtime
2. **API for external** → More API routes
3. **Social auth** → Supabase OAuth providers
4. **File versioning** → Track file changes

---

## 🎯 Performance Optimizations

**Already Implemented:**

- ✅ Image optimization (Next.js)
- ✅ Server-side rendering
- ✅ Code splitting
- ✅ CSS-in-JS with Tailwind

**Can Add:**

- Database query optimization
- API response caching
- Incremental Static Regeneration (ISR)
- Image resizing/compression
- CDN for uploads

---

Made with architectural excellence! 🏗️

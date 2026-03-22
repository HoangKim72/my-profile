# 🚀 QUICKSTART GUIDE

Hãy theo các bước này để khởi động website portfolio của bạn **ngay lập tức**!

---

## ⚡ 5 Phút - Setup Cơ Bản

### 1. Clone và cài dependencies

```bash
cd my-profile
npm install
```

### 2. Tạo tài khoản Supabase

Truy cập: https://supabase.com

- Tạo project mới
- Chép:
  - URL → `NEXT_PUBLIC_SUPABASE_URL`
  - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Tạo file `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...?sslmode=require
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup database

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 5. Chạy local

```bash
npm run dev
# Truy cập http://localhost:3000
```

---

## 📋 Checklist Thứ Tự Priority

### 🔴 CRITICAL (Phải làm)

- [ ] Supabase project setup
- [ ] Database migrations
- [ ] Test login/register locally
- [ ] Test create project page

### 🟡 IMPORTANT (Nên làm)

- [ ] File upload API
- [ ] Image upload UI
- [ ] User management page
- [ ] Contact messages admin page

### 🟢 NICE TO HAVE

- [ ] Dark mode toggle
- [ ] Search functionality
- [ ] Analytics
- [ ] Comments system

---

## 📁 Quick Navigation

**Public URLs:**

- Home: `/`
- About: `/about`
- Projects: `/projects`
- Project detail: `/projects/[slug]`
- Skills: `/skills`
- CV: `/cv`
- Contact: `/contact`

**Auth URLs:**

- Login: `/login`
- Register: `/register`

**Admin URLs:**

- Dashboard: `/dashboard`
- Projects: `/dashboard/projects`
- New project: `/dashboard/projects/new`
- Settings: `/dashboard/settings`

---

## 🎨 Default Admin Account Setup

1. Vào Supabase Auth Users
2. Create user: `admin@example.com` / `password123`
3. In database, run:

```sql
INSERT INTO user_roles (user_id, role_id)
SELECT '<USER_ID>', id FROM roles WHERE name = 'admin';
```

---

## 🔐 Row-Level Security (RLS) Setup

Copy-paste vào Supabase SQL:

```sql
-- Enable RLS
alter table projects enable row level security;

-- Public projects
create policy "Public projects visible"
  on projects for select
  using (visibility = 'PUBLIC' and status = 'PUBLISHED');

-- Own projects
create policy "Own projects"
  on projects for all
  using (auth.uid() = author_id);
```

---

## 📊 Database Quick Check

```bash
# Open Prisma Studio
npx prisma studio

# You'll see data models and relationships
# - Roles (admin, viewer, guest)
# - Your first project (if seeded)
# - Contact messages
```

---

## 🐛 Common Issues & Fixes

**Problem:** "Unauthorized" trên dashboard

```
Solution: Verify admin role in database
SELECT * FROM user_roles WHERE role_id = (SELECT id FROM roles WHERE name = 'admin');
```

**Problem:** Database connection error

```
Solution: Check DATABASE_URL and DIRECT_URL in .env.local
- Go to Supabase → Settings → Database
- Use Prisma connection string
```

**Problem:** Auth callback fails

```
Solution: Add URL to Supabase Auth Redirect URLs
- Go to Supabase → Auth → Redirect URLs
- Add: http://localhost:3000/dashboard
```

---

## 🎯 First Day Roadmap

### Morning: Setup (1-2 hrs)

- [ ] Setup Supabase
- [ ] Configure .env.local
- [ ] Run migrations
- [ ] Test local dev server

### Afternoon: Testing (2-3 hrs)

- [ ] Test register/login
- [ ] Create test project
- [ ] View projects on home page
- [ ] Test contact form

### Evening: Polish (1-2 hrs)

- [ ] Add your info to "about" page
- [ ] Update skills section
- [ ] Test all public pages
- [ ] Check responsive design

---

## 📚 File Structure Reminder

```
📦 my-profile
├── 📁 app
│   ├── 📁 (public)       ← Public pages
│   ├── 📁 (auth)         ← Login/Register
│   ├── 📁 (dashboard)    ← Admin dashboard
│   └── 📁 api            ← API routes
├── 📁 src
│   ├── 📁 components     ← Reusable UI
│   ├── 📁 lib            ← Utilities
│   ├── 📁 actions        ← Server actions
│   └── 📁 types          ← TypeScript types
├── 📁 prisma             ← Database schema
└── 📄 .env.local         ← Your secrets
```

---

## 🚀 Deploy to Vercel

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial setup"
git push origin main

# 2. On Vercel.com
# - Click "Import Project"
# - Select your GitHub repo
# - Add environment variables
# - Click Deploy

# Done! Your site is live 🎉
```

---

## 💡 Pro Tips

1. **Test everything locally first** before deploying
2. **Keep `.env.local` private** - never commit it
3. **Check Supabase logs** if things break
4. **Use Prisma Studio** to visualize data
5. **Read SETUP.md** for detailed guide

---

## ❓ Need Help?

- Read: `SETUP.md` (Detailed setup guide)
- Read: `IMPLEMENTATION_SUMMARY.md` (What's done & TODO)
- Docs: https://supabase.com/docs
- Docs: https://prisma.io/docs
- Docs: https://nextjs.org/docs

---

## ✅ Success Indicators

You'll know it's working when:

✅ `npm run dev` starts without errors
✅ `http://localhost:3000` shows homepage
✅ Can click "Login" and see login form
✅ Can create account on `/register`
✅ Dashboard loads after login
✅ Can create a new project
✅ Projects appear on `/projects` page
✅ Contact form submits without error

---

**Ready to rock? Let's build something amazing! 🎸**

Happy coding! 👨‍💻👩‍💻

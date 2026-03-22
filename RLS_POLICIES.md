# 🔐 Supabase RLS Policies Setup

Copy-paste các policies này vào Supabase SQL Editor để bảo vệ dữ liệu ở mức database.

---

## 📋 Enable RLS on All Tables

```sql
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
```

---

## 👥 Users & Profiles Policies

```sql
-- Users can see their own profile
CREATE POLICY "Users can see own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can see public profiles (optional)
CREATE POLICY "Profiles are viewable by anyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 🎯 Roles & User Roles Policies

```sql
-- Roles are viewable by everyone (public data)
CREATE POLICY "Roles are viewable"
  ON roles FOR SELECT
  USING (true);

-- User roles - users can see their own
CREATE POLICY "Users can see own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can manage user roles
CREATE POLICY "Only admins can manage roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );
```

---

## 📋 Projects Policies (Most Important)

```sql
-- 🟢 PUBLIC projects visible to everyone
CREATE POLICY "Public projects visible to all"
  ON projects FOR SELECT
  USING (
    visibility = 'PUBLIC' AND status = 'PUBLISHED'
  );

-- 🔒 PRIVATE projects - only owner or admin can see
CREATE POLICY "Private projects only for owner or admin"
  ON projects FOR SELECT
  USING (
    (auth.uid() = author_id)
    OR
    (EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    ))
  );

-- 👥 SHARED projects - check permissions table
CREATE POLICY "Shared projects for authorized users"
  ON projects FOR SELECT
  USING (
    (visibility = 'SHARED')
    AND
    (
      (auth.uid() = author_id)
      OR
      (EXISTS (
        SELECT 1 FROM project_permissions
        WHERE project_id = projects.id
        AND user_id = auth.uid()
      ))
      OR
      (EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
      ))
    )
  );

-- Projects owner/admin can update own
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (
    (auth.uid() = author_id)
    OR
    (EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    ))
  );

-- Project creation
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
  );

-- Project deletion
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (
    (auth.uid() = author_id)
    OR
    (EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    ))
  );
```

---

## 📁 Project Files & Images Policies

```sql
-- Files visible if project is visible
CREATE POLICY "Project files visible with project"
  ON project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND (
        (p.visibility = 'PUBLIC' AND p.status = 'PUBLISHED')
        OR (p.auth.uid() = p.author_id)
        OR (EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid()
          AND r.name = 'admin'
        ))
      )
    )
  );

-- Project owner can add files
CREATE POLICY "Users can add files to own projects"
  ON project_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND p.author_id = auth.uid()
    )
    OR
    (EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    ))
  );

-- Same for images
CREATE POLICY "Project images visible with project"
  ON project_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND (
        (p.visibility = 'PUBLIC' AND p.status = 'PUBLISHED')
        OR (p.author_id = auth.uid())
        OR (EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid()
          AND r.name = 'admin'
        ))
      )
    )
  );

CREATE POLICY "Users can add images to own projects"
  ON project_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND p.author_id = auth.uid()
    )
    OR
    (EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    ))
  );
```

---

## 🔐 Project Permissions Policies

```sql
-- View own permissions
CREATE POLICY "Users can see their permissions"
  ON project_permissions FOR SELECT
  USING (
    (auth.uid() = user_id)
    OR
    (EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND p.author_id = auth.uid()
    ))
    OR
    (EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    ))
  );

-- Project owner can grant permissions
CREATE POLICY "Project owner can manage permissions"
  ON project_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND p.author_id = auth.uid()
    )
    OR
    (EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    ))
  );
```

---

## 📝 Contact Messages Policies

```sql
-- Anyone can submit
CREATE POLICY "Anyone can submit messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Sender can see own message
CREATE POLICY "Users can see own messages"
  ON contact_messages FOR SELECT
  USING (
    (auth.uid() = user_id)
    OR
    (EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    ))
  );

-- Admin can manage all messages
CREATE POLICY "Admin can manage messages"
  ON contact_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );
```

---

## 🏷️ Tags & Project Tags Policies

```sql
-- Tags are public
CREATE POLICY "Tags are viewable"
  ON tags FOR SELECT
  USING (true);

-- Project tags visible if project is visible
CREATE POLICY "Project tags visible with project"
  ON project_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND (
        (p.visibility = 'PUBLIC' AND p.status = 'PUBLISHED')
        OR (p.author_id = auth.uid())
        OR (EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid()
          AND r.name = 'admin'
        ))
      )
    )
  );

-- Project owner can add tags
CREATE POLICY "Users can add tags to own projects"
  ON project_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND p.author_id = auth.uid()
    )
    OR
    (EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    ))
  );
```

---

## ✅ Testing RLS Policies

### Test as Anonymous User:

```sql
-- Should see only PUBLIC projects
SELECT * FROM projects WHERE auth.uid() IS NULL;
-- Should return: Public projects only
```

### Test as Authenticated User:

```sql
-- Should see their private projects + public + shared
SELECT * FROM projects
WHERE visibility = 'PRIVATE'
  AND author_id = auth.uid();
-- Should return: Only their projects
```

### Test as Admin:

```sql
-- Should see all projects
SELECT * FROM projects;
-- Should return: All projects
```

---

## 🔧 Debugging RLS

### View all RLS policies:

```sql
SELECT * FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check if RLS is enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Disable RLS temporarily (for testing):

```sql
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
-- ... do testing ...
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
```

---

## 🚨 Common Issues

### **Issue**: "permission denied for schema public"

**Solution**: Make sure user is authenticated (login first)

### **Issue**: Users see no data despite being owner

**Solution**:

1. Check if `auth.uid()` matches `user_id`
2. Verify RLS is enabled on the table
3. Review policy conditions

### **Issue**: Admin can't see all data

**Solution**: Verify admin role is assigned in `user_roles` table

---

## 📚 Resources

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Security First! 🔒**

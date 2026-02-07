# Auth0 + Supabase Setup Guide

This guide will help you set up Auth0 for authentication and Supabase for database storage in your MyHealth app.

## Prerequisites
- Node.js and npm installed
- An Auth0 account (https://auth0.com)
- A Supabase account (https://supabase.com)

---

## STEP 1: Set Up Auth0

### 1.1 Create an Auth0 Application
1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Click "Applications" → "Applications"
3. Click "Create Application"
4. Choose "Single Page Web Applications"
5. Name it "MyHealth" and click "Create"

### 1.2 Configure Auth0 Application Settings
1. Go to your application settings
2. Under **Application URIs**, set:
   - **Allowed Callback URLs**: `http://localhost:5173,http://localhost:5173/callback`
   - **Allowed Logout URLs**: `http://localhost:5173`
   - **Allowed Web Origins**: `http://localhost:5173`
3. Copy your:
   - **Domain** (e.g., `your-tenant.auth0.com`)
   - **Client ID**
4. Click "Save Changes"

### 1.3 Update Environment Variables
Edit `.env.local` in your project root:
```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_CALLBACK_URL=http://localhost:5173
```

---

## STEP 2: Set Up Supabase

### 2.1 Create a Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Enter project details:
   - **Name**: MyHealth
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to you
4. Click "Create new project" (wait 1-2 minutes for setup)

### 2.2 Get Supabase Credentials
1. Go to Project Settings → API
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon Public Key** (under "Project API keys")
3. Update `.env.local`:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2.3 Create Database Table
1. In Supabase Dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy the entire content from `supabase/migrations/001_create_health_logs.sql`
4. Paste it into the SQL editor
5. Click "Run"

This creates:
- `health_logs` table with proper schema
- Row Level Security (RLS) policies for user data protection
- Indexes for better performance

### 2.4 Configure Auth0 with Supabase (Optional but Recommended)
For production, integrate Auth0 as your auth provider:

1. In Supabase Dashboard, go to Authentication → Providers
2. Click "Auth0"
3. Enter your Auth0:
   - Domain
   - Client ID
   - Client Secret
4. Save

---

## STEP 3: Update Production URLs

When deploying to production, update your `.env.local` (or create `.env.production.local`):

```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_production_client_id
VITE_AUTH0_CALLBACK_URL=https://your-domain.com

VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Also update Auth0 Application settings with production URLs.

---

## STEP 4: Test the Setup

1. Run your dev server:
   ```bash
   npm run dev
   ```

2. Your app should now:
   - Show Auth0 login when you visit protected routes
   - Store user sessions in Auth0
   - Save health logs to Supabase
   - Only allow users to access their own logs

---

## Usage in Your Components

### Using Auth0 in Components
```tsx
import { useAuth0 } from '@auth0/auth0-react'

export function MyComponent() {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0()

  if (!isAuthenticated) {
    return <button onClick={() => loginWithRedirect()}>Login</button>
  }

  return <div>Welcome, {user?.name}!</div>
}
```

### Saving Logs
```tsx
import { logService } from '../services/logService'
import { useAuth0 } from '@auth0/auth0-react'

export function CreateLog() {
  const { user } = useAuth0()

  const handleSave = async () => {
    if (!user?.sub) return

    await logService.createLog({
      user_id: user.sub,
      title: 'My Health Log',
      description: 'Feeling better today',
      body_parts: ['back', 'knee'],
      severity: 3,
      date: new Date().toISOString(),
    })
  }

  return <button onClick={handleSave}>Save Log</button>
}
```

### Fetching Logs
```tsx
import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { logService, HealthLog } from '../services/logService'

export function LogsList() {
  const { user } = useAuth0()
  const [logs, setLogs] = useState<HealthLog[]>([])

  useEffect(() => {
    if (!user?.sub) return

    logService.getUserLogs(user.sub).then(setLogs)
  }, [user])

  return (
    <div>
      {logs.map(log => (
        <div key={log.id}>{log.title}</div>
      ))}
    </div>
  )
}
```

---

## Troubleshooting

### "Missing Auth0 environment variables"
- Check `.env.local` exists in your project root
- Verify all `VITE_` variables are set correctly
- Restart your dev server

### Supabase connection errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check your Supabase project is active (not suspended)
- Clear browser cache and cookies

### RLS Policy errors
- Ensure you ran the SQL migration to create RLS policies
- Check that `user_id` in logs matches Auth0 `user.sub`

### Logs not appearing
- Verify user is authenticated with Auth0
- Check browser Network tab in DevTools for API errors
- Ensure RLS policies allow read access

---

## Next Steps

1. Create a login component that wraps your app
2. Update your log pages to use `logService` to save/retrieve logs
3. Implement data synchronization with your existing Dexie local DB
4. Add more fields to the `health_logs` table as needed (e.g., images, measurements)

Good luck! 🚀

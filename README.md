
# TrustStars.dev

TrustStars is a public database of VERIFIED GitHub repositories and developer profiles.

## Setup

1. **Environment Variables**:
   Copy `.env.local` or create it with:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY # Optional for cron
   GITHUB_TOKEN=YOUR_GITHUB_TOKEN # Optional for cron rate limits
   CRON_SECRET=YOUR_CRON_SECRET # Optional for cron protection
   ```

2. **Supabase Setup**:
   - Go to Supabase Project > Authentication > Providers > GitHub.
   - Enable GitHub.
   - Copy client ID and client Secret from GitHub OAuth App.
   - Set Redirect URL to `[YOUR_APP_URL]/auth/callback` (e.g. `http://localhost:3000/auth/callback`).

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Features

- **Authentication**: Sign in with GitHub.
- **Dashboard**: Add repositories you maintain (verified via GitHub API).
- **Public Profiles**: `/dev/[username]` showing verified stats.
- **Repository Profiles**: `/repo/[owner]/[repo]` showing charts.
- **Leaderboard**: `/leaderboard` ranking top verified repos.
- **Cron Job**: `/api/cron` for daily sync.

## Deployment

Deploy on Vercel or similar platform.
Remember to set environment variables in your deployment platform.

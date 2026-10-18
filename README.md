# Public Service Request System (Mini eCitizen)

Citizens report county service problems (streetlights, water, garbage…); admins triage and resolve them.

**Stack:** Next.js 14 (App Router) · Supabase (Postgres, Auth, Storage, Row Level Security)

## Features
- Citizen registration / login (Supabase Auth, role-based routing)
- Submit request: category, location, description, optional image upload
- Citizens track own requests and see admin notes
- Admin dashboard: all requests, filters by status/category, change status (Pending → In Progress → Resolved), add notes
- Basic analytics: totals, open vs resolved, resolution rate, requests per category
- Security: RLS ensures citizens only see their own requests; only admins can change status

## Bonus features
- Map location picker (Leaflet + OpenStreetMap): click the map or use GPS; address is auto-filled; admins get a "View on map" link
- In-app notifications: citizens are alerted (bell icon) when status or admin note changes (database trigger)
- Visual status tracker (Pending → In Progress → Resolved) and short reference numbers on every request
- Admin search, filters, delete, and CSV export

## Setup
1. Create a project at supabase.com.
2. SQL Editor → paste and run `supabase/schema.sql` 
3. (Testing) Authentication → Providers → Email → turn off "Confirm email".
4. Copy `.env.example` to `.env.local` and fill in the Project URL and anon key (Project Settings → API).
5. `npm install` then `npm run dev` → http://localhost:3000
6. Register an account, then run in SQL Editor to make it admin:
   `update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`

7. (Optional) Run `supabase/seed.sql` to load sample requests.

## Demo accounts 
- Admin: register `tarusdorine291@gmail.com` / `Kenya@30`
- Citizen: register `dorinejelagat4@gmail.com` / `Kenya@30`

## Deploy (Vercel)
Push to GitHub, import the repo in Vercel, add the two env variables, deploy.

## Structure
- `app/login` auth · `app/dashboard` citizen · `app/admin` admin
- `lib/` Supabase client + auth hook · `components/` shared UI · `supabase/schema.sql` DB, RLS, storage

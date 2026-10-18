import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const CATEGORIES = ['Streetlight', 'Water Issue', 'Garbage Collection', 'Road Damage', 'Sewage', 'Other'];
export const STATUSES = ['Pending', 'In Progress', 'Resolved'];

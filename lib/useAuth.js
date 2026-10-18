'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

// Loads the session + profile; redirects to /login if signed out, or away if the role is wrong.
export function useAuth({ requireAdmin = false } = {}) {
  const router = useRouter();
  const [state, setState] = useState({ user: null, profile: null, loading: true });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/login');
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (requireAdmin && profile?.role !== 'admin') return router.replace('/dashboard');
      if (active) setState({ user: session.user, profile, loading: false });
    })();
    return () => { active = false; };
  }, [router, requireAdmin]);

  return state;
}

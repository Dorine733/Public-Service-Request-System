'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import NotificationBell from './NotificationBell';

export default function Nav({ profile }) {
  const router = useRouter();
  const logout = async () => { await supabase.auth.signOut(); router.replace('/login'); };
  return (
    <header className="nav">
      <Link href="/" className="brand">🏛️ Public Service Requests</Link>
      <nav>
        <Link href="/dashboard">My Requests</Link>
        {profile?.role === 'admin' && <Link href="/admin">Admin</Link>}
        {profile && <NotificationBell userId={profile.id} />}
        <span className="muted">{profile?.full_name}</span>
        <button className="btn ghost" onClick={logout}>Logout</button>
      </nav>
    </header>
  );
}

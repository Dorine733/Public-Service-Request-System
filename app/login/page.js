'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { email, password, full_name, phone } = form;
    const { data, error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name, phone } } });
    setBusy(false);
    if (error) return setMsg({ type: 'error', text: error.message });
    if (data.session) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      router.replace(p?.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      setMsg({ type: 'ok', text: 'Account created. Check your email to confirm, then log in.' });
    }
  };

  return (
    <main className="auth-wrap">
      <form className="card auth" onSubmit={submit}>
        <h1>🏛️ Public Service Requests</h1>
        <p className="muted">{mode === 'login' ? 'Log in to track your requests' : 'Create a citizen account'}</p>
        {mode === 'register' && (<>
          <label>Full name<input required value={form.full_name} onChange={set('full_name')} /></label>
          <label>Phone<input required value={form.phone} onChange={set('phone')} placeholder="07xx xxx xxx" /></label>
        </>)}
        <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
        <label>Password<input type="password" minLength={6} required value={form.password} onChange={set('password')} /></label>
        {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg(null); }}>
          {mode === 'login' ? 'No account? Register' : 'Have an account? Log in'}
        </button>
      </form>
    </main>
  );
}

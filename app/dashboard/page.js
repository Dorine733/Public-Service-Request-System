'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase, CATEGORIES } from '../../lib/supabase';
import { useAuth } from '../../lib/useAuth';
import Nav from '../../components/Nav';
import StatusBadge from '../../components/StatusBadge';
import Stepper from '../../components/Stepper';
import LocationPicker from '../../components/LocationPicker';

const empty = { category: CATEGORIES[0], location: '', description: '', latitude: null, longitude: null };

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase.from('requests').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false });
    setRequests(data || []);
  }, [user]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const submit = async (e) => {
    e.preventDefault();
    const formEl = e.target;
    setBusy(true); setMsg(null);
    let image_url = null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setBusy(false); return setMsg({ type: 'error', text: 'Image must be under 5MB.' }); }
      const path = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('request-images').upload(path, file);
      if (upErr) { setBusy(false); return setMsg({ type: 'error', text: upErr.message }); }
      image_url = supabase.storage.from('request-images').getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from('requests').insert({ ...form, image_url, user_id: user.id });
    setBusy(false);
    if (error) return setMsg({ type: 'error', text: error.message });
    setForm(empty); setFile(null); formEl.reset(); setPickerKey((k) => k + 1);
    setMsg({ type: 'ok', text: 'Request submitted successfully.' });
    load();
  };

  if (loading) return <p className="center muted">Loading…</p>;

  return (<>
    <Nav profile={profile} />
    <main className="container grid2">
      <form className="card" onSubmit={submit}>
        <h2>Submit a request</h2>
        <label>Category
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Location
          <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Kenol Stage, Murang'a" />
        </label>
        <LocationPicker key={pickerKey} onPick={(p) => setForm((f) => ({ ...f, latitude: p.lat, longitude: p.lng, location: p.address || f.location }))} />
        <label>Description
          <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the problem" />
        </label>
        <label>Image (optional)
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
        </label>
        {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
      </form>

      <section>
        <h2>My requests ({requests.length})</h2>
        {requests.length === 0 && <p className="muted">You have not submitted any requests yet.</p>}
        {requests.map((r) => (
          <article className="card req" key={r.id}>
            <div className="row"><strong>{r.category} <span className="muted small">#{r.id.slice(0, 8).toUpperCase()}</span></strong><StatusBadge status={r.status} /></div>
            <Stepper status={r.status} />
            <p className="muted small">📍 {r.location} · {new Date(r.created_at).toLocaleDateString()}</p>
            <p>{r.description}</p>
            {r.image_url && <img src={r.image_url} alt="Attached" className="thumb" />}
            {r.admin_note && <p className="note"><strong>Update from county:</strong> {r.admin_note}</p>}
          </article>
        ))}
      </section>
    </main>
  </>);
}

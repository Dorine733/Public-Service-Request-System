'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, CATEGORIES, STATUSES } from '../../lib/supabase';
import { useAuth } from '../../lib/useAuth';
import Nav from '../../components/Nav';
import StatusBadge from '../../components/StatusBadge';
import Stepper from '../../components/Stepper';

export default function Admin() {
  const { user, profile, loading } = useAuth({ requireAdmin: true });
  const [requests, setRequests] = useState([]);
  const [fStatus, setFStatus] = useState('All');
  const [fCat, setFCat] = useState('All');
  const [notes, setNotes] = useState({});
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('requests')
      .select('*, profiles(full_name, phone)').order('created_at', { ascending: false });
    setRequests(data || []);
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const update = async (r, patch) => {
    await supabase.from('requests').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', r.id);
    load();
  };

  const stats = useMemo(() => {
    const count = (s) => requests.filter((r) => r.status === s).length;
    const byCat = CATEGORIES.map((c) => ({ c, n: requests.filter((r) => r.category === c).length }));
    return { total: requests.length, pending: count('Pending'), progress: count('In Progress'), resolved: count('Resolved'), byCat };
  }, [requests]);

  const shown = requests.filter((r) =>
    (fStatus === 'All' || r.status === fStatus) && (fCat === 'All' || r.category === fCat) &&
    `${r.location} ${r.description} ${r.profiles?.full_name || ''} ${r.id}`.toLowerCase().includes(q.toLowerCase()));

  const remove = async (r) => {
    if (!confirm('Delete this request permanently?')) return;
    await supabase.from('requests').delete().eq('id', r.id);
    load();
  };

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['ID', 'Category', 'Location', 'Description', 'Status', 'Citizen', 'Phone', 'Created'],
      ...shown.map((r) => [r.id, r.category, r.location, r.description, r.status, r.profiles?.full_name, r.profiles?.phone, r.created_at])];
    const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'service-requests.csv'; a.click();
  };
  const open = stats.pending + stats.progress;
  const max = Math.max(1, ...stats.byCat.map((x) => x.n));

  if (loading) return <p className="center muted">Loading…</p>;

  return (<>
    <Nav profile={profile} />
    <main className="container">
      <h2>Admin dashboard</h2>
      <div className="stats">
        <div className="card stat"><span>{stats.total}</span>Total</div>
        <div className="card stat amber"><span>{stats.pending}</span>Pending</div>
        <div className="card stat blue"><span>{stats.progress}</span>In Progress</div>
        <div className="card stat green"><span>{stats.resolved}</span>Resolved</div>
      </div>

      <div className="card">
        <h3>Analytics: open vs resolved</h3>
        <div className="bar"><div className="fill green" style={{ width: `${stats.total ? (stats.resolved / stats.total) * 100 : 0}%` }} /></div>
        <p className="muted small">{open} open · {stats.resolved} resolved ({stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0}% resolution rate)</p>
        <h3>Requests by category</h3>
        {stats.byCat.map(({ c, n }) => (
          <div className="cat-row" key={c}><span>{c}</span>
            <div className="bar"><div className="fill blue" style={{ width: `${(n / max) * 100}%` }} /></div><b>{n}</b></div>
        ))}
      </div>

      <div className="row filters">
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          {['All', ...STATUSES].map((s) => <option key={s}>{s}</option>)}</select>
        <select value={fCat} onChange={(e) => setFCat(e.target.value)}>
          {['All', ...CATEGORIES].map((s) => <option key={s}>{s}</option>)}</select>
        <input className="search" placeholder="Search location, citizen, description…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muted">{shown.length} shown</span>
        <button className="btn ghost small" onClick={exportCsv}>⬇ Export CSV</button>
      </div>

      {shown.map((r) => (
        <article className="card req" key={r.id}>
          <div className="row"><strong>{r.category} <span className="muted small">#{r.id.slice(0, 8).toUpperCase()}</span></strong><StatusBadge status={r.status} /></div>
          <Stepper status={r.status} />
          <p className="muted small">📍 {r.location} · {r.profiles?.full_name} ({r.profiles?.phone}) · {new Date(r.created_at).toLocaleString()}
            {r.latitude && <> · <a className="maplink" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=17/${r.latitude}/${r.longitude}`}>View on map</a></>}</p>
          <p>{r.description}</p>
          {r.image_url && <a href={r.image_url} target="_blank" rel="noreferrer"><img src={r.image_url} alt="Attached" className="thumb" /></a>}
          <div className="row actions">
            <select value={r.status} onChange={(e) => update(r, { status: e.target.value })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            <input placeholder="Note to citizen…" value={notes[r.id] ?? r.admin_note ?? ''}
              onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
            <button className="btn small" onClick={() => update(r, { admin_note: notes[r.id] ?? r.admin_note })}>Save note</button>
            <button className="btn ghost small" onClick={() => remove(r)}>🗑</button>
          </div>
        </article>
      ))}
    </main>
  </>);
}

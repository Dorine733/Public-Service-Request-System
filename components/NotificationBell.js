'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function NotificationBell({ userId }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
    setItems(data || []);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    load();
    const t = setInterval(load, 20000); // refresh every 20s
    return () => clearInterval(t);
  }, [userId, load]);

  const unread = items.filter((n) => !n.read).length;
  const toggle = async () => {
    setOpen(!open);
    if (!open && unread) {
      await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
      setTimeout(load, 1500);
    }
  };

  return (
    <div className="bell">
      <button className="btn ghost" onClick={toggle} aria-label="Notifications">
        🔔{unread > 0 && <span className="dot">{unread}</span>}
      </button>
      {open && (
        <div className="card dropdown">
          {items.length === 0 && <p className="muted small">No notifications yet.</p>}
          {items.map((n) => (
            <div key={n.id} className={`ntf ${n.read ? '' : 'unread'}`}>
              {n.message}<br /><span className="muted small">{new Date(n.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

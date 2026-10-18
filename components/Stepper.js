import { STATUSES } from '../lib/supabase';

export default function Stepper({ status }) {
  const cur = STATUSES.indexOf(status);
  return (
    <div className="stepper">
      {STATUSES.map((s, i) => (
        <div key={s} className={`step ${i <= cur ? 'done' : ''}`}><i>{i <= cur ? '✓' : i + 1}</i>{s}</div>
      ))}
    </div>
  );
}

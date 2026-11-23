/**
 * Günün Analizi
 * Veri: GET /api/dashboard/daily?date=YYYY-MM-DD
 * Üstteki koyu şerit sayfanın odağıdır: bugünün çağrı sayıları + saat saat çağrı ritmi.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import PageHeader from '../components/PageHeader';
import Panel from '../components/Panel';
import { formatDuration, todayIstanbul } from '../utils/format';

const todayStr = todayIstanbul;

const timeOf = (d) => new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });

export default function Dashboard() {
  const [date, setDate] = useState(todayStr);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  // Şu anki saat (İstanbul): çağrı ritminde bu saatin sütunu vurgulanır
  const [nowHour] = useState(() => Number(new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/Istanbul' })));

  useEffect(() => {
    let cancelled = false;
    api.get('/dashboard/daily', { params: { date } })
      .then((res) => { if (!cancelled) { setData(res.data.data); setError(''); } })
      .catch((err) => { if (!cancelled) setError(errorMessage(err)); });
    return () => { cancelled = true; };
  }, [date]);

  const isToday = date === todayStr();
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });

  return (
    <>
      <PageHeader title="Günün Analizi" subtitle={isToday ? `Bugün, ${dateLabel}` : dateLabel}>
        <label htmlFor="dash-date" className="visually-hidden">Gün seç</label>
        <input id="dash-date" type="date" className="form-control" value={date} max={todayStr()}
          onChange={(e) => e.target.value && setDate(e.target.value)} />
        {!isToday && (
          <button type="button" className="btn btn-outline-secondary" onClick={() => setDate(todayStr())}>Bugüne dön</button>
        )}
      </PageHeader>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {!data && !error && <p className="text-body-secondary">Yükleniyor…</p>}

      {data && (
        <>
          <TodayStrip data={data} isToday={isToday} nowHour={nowHour} />

          <div className="counters">
            <Counter to="/biletler" icon="ticket-perforated" tone="tickets" value={data.tickets.open} label="Açık ticket" />
            <Counter to="/biletler" icon="hourglass-split" tone="tickets" value={data.tickets.waiting} label="Cevap bekleyen ticket" />
            <Counter to="/teklifler" icon="send" tone="offers" value={data.offers.sent} label="Cevap bekleyen teklif" />
            <Counter to="/teklifler" icon="pencil-square" tone="offers" value={data.offers.draft} label="Hazırlanan teklif" />
          </div>

          <div className="row g-3">
            <div className="col-xl-8">
              <Panel title={isToday ? 'Bugün arayan müşteriler' : 'O gün arayan müşteriler'} icon="headset" color="green" flush>
                <RecentCallers rows={data.recentCallers} />
              </Panel>
            </div>
            <div className="col-xl-4">
              <Panel title="Müşteri temsilcileri" icon="person-badge" color="blue" flush>
                <Agents rows={data.agents} />
              </Panel>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function TodayStrip({ data, isToday, nowHour }) {
  const { calls, previous, hourly } = data;

  // İş saatlerini (08-19) her zaman göster; dışında çağrı varsa aralığı genişlet
  const active = hourly.filter((h) => h.incoming + h.outgoing > 0).map((h) => h.hour);
  const from = Math.min(8, ...active);
  const to = Math.max(19, ...active);
  const hours = hourly.slice(from, to + 1);
  const max = Math.max(1, ...hours.map((h) => h.incoming + h.outgoing));

  return (
    <section className="today" aria-label="Günün çağrı özeti">
      <div className="today-figures">
        <Figure label="Gelen çağrı" dot="var(--tone-in)" value={calls.incoming} prev={previous.incoming} />
        <Figure label="Giden çağrı" dot="#6fa2ff" value={calls.outgoing} prev={previous.outgoing} />
        <div>
          <div className="figure-label">Toplam görüşme</div>
          <div className="figure-value">{formatDuration(calls.total_duration_sec)}</div>
          <div className="figure-note">Ortalama {formatDuration(calls.avg_duration_sec)}</div>
        </div>
      </div>

      <div className="rhythm">
        <div className="rhythm-head">
          <span>Saat saat çağrılar</span>
          <span className="rhythm-legend">
            <span><span className="figure-dot d-inline-block me-1" style={{ background: '#3ccf98' }} />Gelen</span>
            <span><span className="figure-dot d-inline-block me-1" style={{ background: '#6fa2ff' }} />Giden</span>
          </span>
        </div>
        <div className="rhythm-bars" style={{ '--hours': hours.length }} role="img"
          aria-label={hours.map((h) => `${h.hour}:00 ${h.incoming} gelen ${h.outgoing} giden`).join(', ')}>
          {hours.map((h) => (
            <div key={h.hour} className={`rhythm-col${isToday && h.hour === nowHour ? ' is-now' : ''}`}
              title={`${String(h.hour).padStart(2, '0')}:00, ${h.incoming} gelen, ${h.outgoing} giden`}>
              <span className="out" style={{ height: `${(h.outgoing / max) * 100}%` }} />
              <span className="in" style={{ height: `${(h.incoming / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="rhythm-axis" style={{ '--hours': hours.length }} aria-hidden="true">
          {hours.map((h) => <span key={h.hour}>{h.hour % 2 === 0 ? String(h.hour).padStart(2, '0') : ''}</span>)}
        </div>
      </div>
    </section>
  );
}

function Figure({ label, dot, value, prev }) {
  const diff = value - prev;
  return (
    <div>
      <div className="figure-label"><span className="figure-dot" style={{ background: dot }} />{label}</div>
      <div className="figure-value">{value}</div>
      <div className="figure-note">
        Önceki gün {prev}
        {diff !== 0 && <span className={diff > 0 ? 'up' : 'down'}> ({diff > 0 ? '+' : ''}{diff})</span>}
      </div>
    </div>
  );
}

function Counter({ to, icon, tone, value, label }) {
  return (
    <Link to={to} className="counter">
      <span className={`counter-icon ${tone}`} aria-hidden="true"><i className={`bi bi-${icon}`} /></span>
      <span>
        <span className="counter-value d-block">{value}</span>
        <span className="counter-label">{label}</span>
      </span>
    </Link>
  );
}

function RecentCallers({ rows }) {
  if (rows.length === 0) return <div className="empty">Bu gün için kayıtlı çağrı yok.</div>;
  return (
    <div className="table-responsive">
      <table className="table align-middle">
        <thead>
          <tr>
            <th scope="col">Müşteri</th>
            <th scope="col">Son çağrı</th>
            <th scope="col">Yön</th>
            <th scope="col" className="text-end">Çağrı</th>
            <th scope="col">Temsilci</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <Link to={`/musteriler/${r.id}`} className="fw-medium">{r.name}</Link>
                {r.company && <div className="small text-body-secondary">{r.company}</div>}
              </td>
              <td>{timeOf(r.last_call_at)}</td>
              <td>
                <span className={`chip ${r.last_direction === 'gelen' ? 'chip-in' : 'chip-out'}`}>
                  <i className={`bi bi-telephone-${r.last_direction === 'gelen' ? 'inbound' : 'outbound'}`} aria-hidden="true" />
                  {r.last_direction === 'gelen' ? 'Gelen' : 'Giden'}
                </span>
              </td>
              <td className="text-end">{r.calls}</td>
              <td>{r.last_agent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Agents({ rows }) {
  if (rows.length === 0) return <div className="empty">Bu gün çağrı yapan temsilci yok.</div>;
  const max = Math.max(...rows.map((a) => a.incoming + a.outgoing));
  return (
    <ul className="list-unstyled mb-0">
      {rows.map((a) => {
        const total = a.incoming + a.outgoing;
        return (
          <li key={a.id} className="agent">
            <div className="agent-row">
              <span>{a.name}</span>
              <span className="agent-total">{total} çağrı</span>
            </div>
            <div className="agent-bar" style={{ width: `${(total / max) * 100}%` }} aria-hidden="true">
              <span className="in" style={{ width: `${(a.incoming / total) * 100}%` }} />
              <span className="out" style={{ width: `${(a.outgoing / total) * 100}%` }} />
            </div>
            <div className="agent-meta">{a.incoming} gelen, {a.outgoing} giden, {formatDuration(a.duration_sec)} görüşme</div>
          </li>
        );
      })}
    </ul>
  );
}

import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
import PageHeader from '../components/PageHeader';
import Panel from '../components/Panel';
import CallSummary from '../components/dashboard/CallSummary';
import CounterCard from '../components/dashboard/CounterCard';
import RecentCallers from '../components/dashboard/RecentCallers';
import AgentList from '../components/dashboard/AgentList';
import { currentHourIstanbul, formatLongDate, todayIstanbul } from '../utils/format';

function useDailySummary(date) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/dashboard/daily', { params: { date } })
      .then((res) => { if (!cancelled) { setSummary(res.data.data); setError(''); } })
      .catch((err) => { if (!cancelled) setError(errorMessage(err)); });
    return () => { cancelled = true; };
  }, [date]);

  return { summary, error };
}

export default function Dashboard() {
  const [today] = useState(todayIstanbul);
  const [currentHour] = useState(currentHourIstanbul);
  const [date, setDate] = useState(today);
  const { summary, error } = useDailySummary(date);

  const isToday = date === today;
  const subtitle = isToday ? `Bugün, ${formatLongDate(date)}` : formatLongDate(date);

  return (
    <>
      <PageHeader title="Günün Analizi" subtitle={subtitle}>
        <label htmlFor="dashboard-date" className="visually-hidden">Gün seç</label>
        <input
          id="dashboard-date"
          type="date"
          className="form-control"
          value={date}
          max={today}
          onChange={(e) => e.target.value && setDate(e.target.value)}
        />
        {!isToday && (
          <button type="button" className="btn btn-outline-secondary" onClick={() => setDate(today)}>
            Bugüne dön
          </button>
        )}
      </PageHeader>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {!summary && !error && <p className="text-body-secondary">Yükleniyor…</p>}

      {summary && (
        <>
          <CallSummary
            calls={summary.calls}
            previous={summary.previous}
            hourly={summary.hourly}
            highlightHour={isToday ? currentHour : null}
          />

          <div className="counters">
            <CounterCard to="/biletler" icon="ticket-perforated" tone="tickets" value={summary.tickets.open} label="Açık ticket" />
            <CounterCard to="/biletler" icon="hourglass-split" tone="tickets" value={summary.tickets.waiting} label="Cevap bekleyen ticket" />
            <CounterCard to="/teklifler" icon="send" tone="offers" value={summary.offers.sent} label="Cevap bekleyen teklif" />
            <CounterCard to="/teklifler" icon="pencil-square" tone="offers" value={summary.offers.draft} label="Hazırlanan teklif" />
          </div>

          <div className="row g-3">
            <div className="col-xl-8">
              <Panel title={isToday ? 'Bugün arayan müşteriler' : 'O gün arayan müşteriler'} icon="headset" color="green" flush>
                <RecentCallers callers={summary.recentCallers} />
              </Panel>
            </div>
            <div className="col-xl-4">
              <Panel title="Müşteri temsilcileri" icon="person-badge" color="blue" flush>
                <AgentList agents={summary.agents} />
              </Panel>
            </div>
          </div>
        </>
      )}
    </>
  );
}

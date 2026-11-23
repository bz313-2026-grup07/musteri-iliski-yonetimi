import { formatDuration } from '../../utils/format';

const BUSINESS_HOURS = { start: 8, end: 19 };
const INBOUND_COLOR = '#3ccf98';
const OUTBOUND_COLOR = '#6fa2ff';

// Mesai saatleri hep görünür; mesai dışında çağrı varsa aralık o saate kadar genişler.
function visibleHours(hourly) {
  const activeHours = hourly.filter((h) => h.incoming + h.outgoing > 0).map((h) => h.hour);
  const first = Math.min(BUSINESS_HOURS.start, ...activeHours);
  const last = Math.max(BUSINESS_HOURS.end, ...activeHours);
  return hourly.slice(first, last + 1);
}

const pad = (hour) => String(hour).padStart(2, '0');

function Figure({ label, color, value, previous }) {
  const change = value - previous;
  return (
    <div>
      <div className="figure-label"><span className="figure-dot" style={{ background: color }} />{label}</div>
      <div className="figure-value">{value}</div>
      <div className="figure-note">
        Önceki gün {previous}
        {change !== 0 && <span className={change > 0 ? 'up' : 'down'}> ({change > 0 ? '+' : ''}{change})</span>}
      </div>
    </div>
  );
}

function HourlyChart({ hourly, highlightHour }) {
  const hours = visibleHours(hourly);
  const peak = Math.max(1, ...hours.map((h) => h.incoming + h.outgoing));
  const columns = { '--hours': hours.length };
  const description = hours.map((h) => `${pad(h.hour)}:00 ${h.incoming} gelen ${h.outgoing} giden`).join(', ');

  return (
    <div className="rhythm">
      <div className="rhythm-head">
        <span>Saat saat çağrılar</span>
        <span className="rhythm-legend">
          <span><span className="figure-dot d-inline-block me-1" style={{ background: INBOUND_COLOR }} />Gelen</span>
          <span><span className="figure-dot d-inline-block me-1" style={{ background: OUTBOUND_COLOR }} />Giden</span>
        </span>
      </div>

      <div className="rhythm-bars" style={columns} role="img" aria-label={description}>
        {hours.map((h) => (
          <div
            key={h.hour}
            className={`rhythm-col${h.hour === highlightHour ? ' is-now' : ''}`}
            title={`${pad(h.hour)}:00, ${h.incoming} gelen, ${h.outgoing} giden`}
          >
            <span className="out" style={{ height: `${(h.outgoing / peak) * 100}%` }} />
            <span className="in" style={{ height: `${(h.incoming / peak) * 100}%` }} />
          </div>
        ))}
      </div>

      <div className="rhythm-axis" style={columns} aria-hidden="true">
        {hours.map((h) => <span key={h.hour}>{h.hour % 2 === 0 ? pad(h.hour) : ''}</span>)}
      </div>
    </div>
  );
}

export default function CallSummary({ calls, previous, hourly, highlightHour }) {
  return (
    <section className="today" aria-label="Günün çağrı özeti">
      <div className="today-figures">
        <Figure label="Gelen çağrı" color="var(--tone-in)" value={calls.incoming} previous={previous.incoming} />
        <Figure label="Giden çağrı" color={OUTBOUND_COLOR} value={calls.outgoing} previous={previous.outgoing} />
        <div>
          <div className="figure-label">Toplam görüşme</div>
          <div className="figure-value">{formatDuration(calls.total_duration_sec)}</div>
          <div className="figure-note">Ortalama {formatDuration(calls.avg_duration_sec)}</div>
        </div>
      </div>
      <HourlyChart hourly={hourly} highlightHour={highlightHour} />
    </section>
  );
}
